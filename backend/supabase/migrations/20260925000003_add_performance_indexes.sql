-- Add indexes to dramatically speed up the frontend queries
CREATE INDEX IF NOT EXISTS idx_articles_cluster_id ON articles(cluster_id);
CREATE INDEX IF NOT EXISTS idx_clusters_synthesis_status ON clusters(synthesis_status);
CREATE INDEX IF NOT EXISTS idx_clusters_category ON clusters(category);
CREATE INDEX IF NOT EXISTS idx_clusters_heat_index ON clusters(heat_index DESC);
