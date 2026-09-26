import { Tweet } from 'react-tweet';
import { MessageSquare, ArrowUpCircle } from 'lucide-react';

export function SocialDiscussions({ socialData, storyTitle, compact = false }: { socialData?: any, storyTitle?: string, compact?: boolean }) {
  if (!socialData || (!socialData.twitter?.length && !socialData.reddit?.length)) {
    return (
      <div className={`mt-8 mb-6 rounded-lg border border-red-100 bg-red-50/30 flex flex-col items-center justify-center text-center p-6 text-red-500`}>
         <span className="font-bold tracking-widest text-sm uppercase mb-2">Exclusive</span>
         <span className="text-xs">We are currently fetching community discussions for this story...</span>
      </div>
    );
  }

  const data = socialData;
  const searchHeadline = storyTitle ? encodeURIComponent(storyTitle) : '';

  return (
    <div className={`mt-8 mb-6 rounded-lg border border-red-100 bg-red-50/30 flex flex-col relative overflow-hidden ${compact ? 'p-3 md:p-4' : 'p-4 md:p-6'}`}>
      <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-red-500"></div>
      
      <div className={`flex ${compact ? 'flex-col gap-3' : 'flex-col md:flex-row md:items-center justify-between'} mb-6 pl-2`}>
        <div>
          <div className="flex items-center gap-3 mb-1">
            <span className="text-red-600 font-bold tracking-widest text-sm uppercase">Exclusive</span>
            {!compact && <span className="font-bold text-foreground text-sm uppercase">What People Are Saying</span>}
          </div>
          <p className="text-xs md:text-sm text-muted-foreground">
            {compact ? 'What People Are Saying' : 'Popular voices and community discussions on this trending topic from X (Twitter) and Reddit.'}
          </p>
        </div>
        <div className="shrink-0 bg-red-100 text-red-700 text-[10px] md:text-xs font-bold px-2 py-1 md:px-3 rounded-full uppercase tracking-wider flex items-center gap-2 self-start">
          <span className="w-1.5 h-1.5 md:w-2 md:h-2 rounded-full bg-red-500 animate-pulse"></span>
          Live Feed
        </div>
      </div>

      <div className={`grid grid-cols-1 ${compact ? '' : 'md:grid-cols-2'} gap-4`}>
        
        {/* X / TWITTER PANEL */}
        <div className="rounded-xl border border-border bg-card p-4 md:p-5 flex flex-col">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-6 h-6 md:w-8 md:h-8 bg-black rounded-md flex items-center justify-center text-white font-bold text-xs md:text-base">𝕏</div>
            <span className="font-bold text-xs md:text-sm tracking-widest">X / TWITTER</span>
          </div>
          {!compact && <p className="text-[10px] md:text-xs text-muted-foreground mb-4">Takes from public figures, experts and relevant voices on this story.</p>}
          
          {!compact && (
            <div className="flex flex-wrap gap-2 mb-6">
              <span className="bg-secondary text-secondary-foreground text-[9px] md:text-[10px] font-semibold px-2 py-1 rounded-full flex items-center gap-1">👤 Politicians</span>
              <span className="bg-secondary text-secondary-foreground text-[9px] md:text-[10px] font-semibold px-2 py-1 rounded-full flex items-center gap-1">🔬 Experts</span>
              <span className="bg-secondary text-secondary-foreground text-[9px] md:text-[10px] font-semibold px-2 py-1 rounded-full flex items-center gap-1">✍️ Journalists</span>
            </div>
          )}

          <div className={`mt-auto space-y-4 ${compact ? 'mt-3' : ''}`}>
            {data.twitter.map((tweet: any) => {
              const xUrl = tweet.url || (searchHeadline ? `https://twitter.com/search?q=${searchHeadline}` : '#');
              return (
              <a href={xUrl} target="_blank" rel="noreferrer" key={tweet.id} className="block border border-border rounded-xl p-4 bg-background hover:bg-muted/50 transition-colors">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center font-bold text-xs uppercase">{tweet.author.slice(0, 2)}</div>
                  <div className="flex flex-col">
                    <span className="font-bold text-sm leading-none">{tweet.author}</span>
                    <span className="text-xs text-muted-foreground">@{tweet.author.toLowerCase().replace(/[^a-z0-9]/g, '')}</span>
                  </div>
                </div>
                <p className="text-sm mb-3">{tweet.text}</p>
                <div className="flex items-center gap-6 text-xs font-semibold text-muted-foreground">
                  <span className="flex items-center gap-1"><MessageSquare className="w-4 h-4" /> {tweet.metrics?.replies?.toLocaleString()}</span>
                  <span className="flex items-center gap-1">🔁 {tweet.metrics?.reposts?.toLocaleString()}</span>
                  <span className="flex items-center gap-1 text-red-500">❤️ {tweet.metrics?.likes?.toLocaleString()}</span>
                </div>
              </a>
            )})}
          </div>
        </div>

        {/* REDDIT PANEL */}
        <div className="rounded-xl border border-border bg-card p-4 md:p-5 flex flex-col">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-6 h-6 md:w-8 md:h-8 bg-[#FF4500] rounded-md flex items-center justify-center text-white">
              <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 md:w-5 md:h-5"><path d="M10 0C4.477 0 0 4.477 0 10s4.477 10 10 10 10-4.477 10-10S15.523 0 10 0zM15.485 13.068c-.024.03-.68.835-2.222 1.57-1.353.645-3.076.71-3.26.71-.185 0-1.908-.065-3.262-.71-1.542-.735-2.198-1.54-2.222-1.57-.107-.134-.085-.327.05-.432.133-.106.326-.084.432.05.006.008.572.71 1.93 1.356 1.157.552 2.65.626 3.07.626.42 0 1.913-.074 3.07-.626 1.358-.646 1.924-1.348 1.93-1.356.106-.134.3-.156.432-.05.135.105.157.3.05.432zM15.5 9c-.828 0-1.5-.672-1.5-1.5S14.672 6 15.5 6 17 6.672 17 7.5 16.328 9 15.5 9zM4.5 9C3.672 9 3 8.328 3 7.5S3.672 6 4.5 6 6 6.672 6 7.5 5.328 9 4.5 9zm6.75 3.5c-.414 0-.75-.336-.75-.75s.336-.75.75-.75.75.336.75.75-.336.75-.75.75zm-2.5 0c-.414 0-.75-.336-.75-.75s.336-.75.75-.75.75.336.75.75-.336.75-.75.75z"/></svg>
            </div>
            <span className="font-bold text-xs md:text-sm tracking-widest">REDDIT</span>
          </div>
          {!compact && <p className="text-[10px] md:text-xs text-muted-foreground mb-4">Relevant community discussions and public reactions on this story.</p>}
          
          {!compact && (
            <div className="flex flex-wrap gap-2 mb-6">
              <span className="bg-secondary text-secondary-foreground text-[9px] md:text-[10px] font-semibold px-2 py-1 rounded-full flex items-center gap-1">🔥 Top Discussions</span>
              <span className="bg-secondary text-secondary-foreground text-[9px] md:text-[10px] font-semibold px-2 py-1 rounded-full flex items-center gap-1">🧠 Key Perspectives</span>
              <span className="bg-secondary text-secondary-foreground text-[9px] md:text-[10px] font-semibold px-2 py-1 rounded-full flex items-center gap-1">📊 Community Sentiment</span>
            </div>
          )}

          <div className={`mt-auto space-y-3 ${compact ? 'mt-3' : ''}`}>
            {data.reddit.map((post: any) => {
              const rUrl = (!post.url || post.url === 'https://reddit.com/r/news') && searchHeadline 
                ? `https://www.reddit.com/search/?q=${searchHeadline}` 
                : (post.url || '#');
              return (
              <a key={post.id} href={rUrl} target="_blank" rel="noreferrer" className="block border border-border rounded-lg p-3 hover:bg-muted/50 transition-colors">
                 <div className="flex items-center gap-2 mb-2 text-[10px] font-bold text-muted-foreground">
                    <span className="text-[#FF4500]">{post.author}</span>
                 </div>
                 <h4 className="text-xs md:text-sm font-semibold mb-3 leading-snug">{post.text}</h4>
                 <div className="flex items-center gap-4 text-[10px] md:text-xs font-semibold text-muted-foreground">
                    <span className="flex items-center gap-1 text-[#FF4500]"><ArrowUpCircle className="w-3 h-3 md:w-4 md:h-4" /> {post.metrics?.likes?.toLocaleString()}</span>
                    <span className="flex items-center gap-1"><MessageSquare className="w-3 h-3 md:w-4 md:h-4" /> {post.metrics?.replies?.toLocaleString()}</span>
                 </div>
              </a>
            )})}
          </div>
        </div>

      </div>
    </div>
  );
}
