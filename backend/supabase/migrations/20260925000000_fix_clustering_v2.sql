-- Fix clustering: much tighter threshold, cosine-dominant scoring
-- This prevents random unrelated articles from being grouped together

CREATE OR REPLACE FUNCTION process_article_clustering(
    p_article_id UUID,
    p_embedding vector(768),
    p_raw_entities text[],
    p_snippet text
) RETURNS UUID AS $$
DECLARE
    v_cluster_id UUID;
    v_cand_a_id UUID := NULL;
    v_cand_a_origin vector(768);
    v_cand_b_id UUID := NULL;
    v_score_a FLOAT := 0;
    v_score_b FLOAT := 0;
    -- MUCH tighter: was 0.45, now 0.72
    -- Cosine similarity alone must be very high for articles to be about the same event
    v_threshold FLOAT := 0.72;
    v_drift_floor FLOAT := 0.5;
    v_record RECORD;
    v_score FLOAT;
    v_cos_sim FLOAT;
    v_entity_overlap FLOAT;
    v_time_decay FLOAT;
    -- Heavily weight cosine similarity (the embedding understands topic)
    -- Entity overlap is secondary (raw regex entities are noisy)
    -- Time decay is just a tiebreaker
    v_alpha FLOAT := 0.75;   -- was 0.4 — cosine is king
    v_beta  FLOAT := 0.10;   -- was 0.4 — entity regex is too noisy to trust
    v_gamma FLOAT := 0.15;   -- was 0.2 — recency matters a little
    v_origin_drift FLOAT;
    v_syndicated_match UUID;
BEGIN
    PERFORM pg_advisory_xact_lock(hashtext('clustering_lock'));

    FOR v_record IN 
        SELECT id, centroid, origin_centroid, last_updated, entity_set 
        FROM clusters 
        WHERE status = 'active'
        ORDER BY centroid <=> p_embedding
        LIMIT 5
    LOOP
        -- cosine distance -> cosine similarity
        v_cos_sim := 1.0 - (v_record.centroid <=> p_embedding);
        
        -- Hard floor: if cosine similarity < 0.6, skip entirely — not the same story
        IF v_cos_sim < 0.6 THEN
            CONTINUE;
        END IF;
        
        v_time_decay := GREATEST(0, 1.0 - (EXTRACT(EPOCH FROM (now() - v_record.last_updated)) / (48 * 3600)));
        v_entity_overlap := array_jaccard(v_record.entity_set, p_raw_entities);
        v_score := (v_alpha * v_cos_sim) + (v_beta * v_entity_overlap) + (v_gamma * v_time_decay);

        IF v_score > v_score_a THEN
            v_score_b := v_score_a;
            v_cand_b_id := v_cand_a_id;
            
            v_score_a := v_score;
            v_cand_a_id := v_record.id;
            v_cand_a_origin := v_record.origin_centroid;
        ELSIF v_score > v_score_b THEN
            v_score_b := v_score;
            v_cand_b_id := v_record.id;
        END IF;
    END LOOP;

    UPDATE articles SET embedding = p_embedding, embedding_status = 'embedded' WHERE id = p_article_id;

    IF v_score_a >= v_threshold AND v_cand_a_id IS NOT NULL THEN
        v_origin_drift := 1.0 - (v_cand_a_origin <=> p_embedding);
        
        -- Reject if drifted too far from the cluster's original seed
        IF v_origin_drift < v_drift_floor THEN
            -- Don't queue for review, just create a new cluster
            INSERT INTO clusters (centroid, origin_centroid, status, last_updated, entity_set, synthesis_status)
            VALUES (p_embedding, p_embedding, 'active', now(), p_raw_entities, 'pending')
            RETURNING id INTO v_cluster_id;
            UPDATE articles SET cluster_id = v_cluster_id WHERE id = p_article_id;
            RETURN v_cluster_id;
        END IF;

        v_cluster_id := v_cand_a_id;
        
        -- Syndication detection
        SELECT id INTO v_syndicated_match
        FROM articles
        WHERE cluster_id = v_cluster_id
          AND id != p_article_id
          AND similarity(snippet, p_snippet) > 0.9
        LIMIT 1;

        IF v_syndicated_match IS NOT NULL THEN
            UPDATE articles SET syndicated_from = v_syndicated_match WHERE id = p_article_id;
        END IF;

        -- Update cluster last_updated and entity_set (do not move centroid to prevent drift and avoid pgvector math errors)
        UPDATE clusters 
        SET last_updated = now(),
            entity_set = ARRAY(SELECT DISTINCT unnest(array_cat(entity_set, p_raw_entities)))
        WHERE id = v_cluster_id;
        
    ELSE
        -- No good match: create a brand new cluster for this article
        INSERT INTO clusters (centroid, origin_centroid, status, last_updated, entity_set, synthesis_status)
        VALUES (p_embedding, p_embedding, 'active', now(), p_raw_entities, 'pending')
        RETURNING id INTO v_cluster_id;
    END IF;

    UPDATE articles SET cluster_id = v_cluster_id WHERE id = p_article_id;
    RETURN v_cluster_id;
END;
$$ LANGUAGE plpgsql;
