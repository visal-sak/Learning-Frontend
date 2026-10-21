// Map a ReviewResponse to TwitterCard props
const handleOf = (name = "") => name.toLowerCase().normalize("NFKD").replace(/[^a-z0-9]+/g, "") || "learner"

export function reviewToTweet(r) {
  return {
    author: {
      name: r.authorName,
      handle: handleOf(r.authorName),
      avatar: r.authorAvatarUrl,
      // "Verified" = finished the course before reviewing it
      verified: (r.percentCompleteWhenWritten ?? 0) >= 100,
    },
    content: r.comment,
    timestamp: r.updatedAt ?? r.createdAt,
    rating: r.rating,
  }
}
