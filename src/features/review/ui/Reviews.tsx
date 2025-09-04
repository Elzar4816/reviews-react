import { useUser } from '@shared/context/UserContext.tsx'
import { useParams, Link } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { getReviews } from '@features/review/api/getReviews.ts'
import { likeReview } from '@features/review/api/likeReview.ts'
import { unlikeReview } from '@features/review/api/unlikeReview.ts'
import { FiStar, FiThumbsUp, FiThumbsDown, FiChevronDown, FiPlus } from 'react-icons/fi'
import { FaRegCommentDots } from 'react-icons/fa'
import { ReviewAspectCard } from './ReviewAspectCard'
import { AnimatePresence, motion } from 'framer-motion'

interface ReviewAspect { id: number; description: string }
interface ReviewsProps { type: 'specialist' | 'organization' }
interface Author { id: number; name: string; avatar_url: string }
interface Review {
    id: number
    author: Author | null
    rating: number
    text: string
    created_at: string
    pros: ReviewAspect[]
    cons: ReviewAspect[]
    usefulCount?: number
    userHasLiked?: boolean
}

export const Reviews = ({ type }: ReviewsProps) => {
    const { id: profileId } = useParams()
    const { user, loading: userLoading } = useUser()
    const [reviews, setReviews] = useState<Review[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [disabledLikes, setDisabledLikes] = useState<{ [key: number]: boolean }>({})
    const [openAspects, setOpenAspects] = useState<{ [key: number]: 'pros' | 'cons' | null }>({})
    const [sort, setSort] = useState<'newest' | 'oldest'>('newest')
    const [offset, setOffset] = useState(0)
    const [hasMore, setHasMore] = useState(true)
    const [isPageReset, setIsPageReset] = useState(false)
    const limit = 5
    const [expandedReviews, setExpandedReviews] = useState<{ [key: number]: boolean }>({})

    // Fetch logic
    const fetchReviews = async (reset = false) => {
        try {
            setLoading(true)
            const data = await getReviews(profileId as string, { limit, offset: reset ? 0 : offset, sort })
            if (reset) {
                setReviews(data)
            } else {
                setReviews(prev => [...prev, ...data])
            }
            setHasMore(data.length === limit)
        } catch (err: any) {
            setError(err.response?.data?.error || err.message)
        } finally {
            setLoading(false)
        }
    }

    const handleLoadMore = () => {
        setOffset(prev => prev + limit)
    }

    const handleSortChange = () => {
        setSort(prev => (prev === 'newest' ? 'oldest' : 'newest'))
        setOffset(0)
        setIsPageReset(true)
    }

    const handleUsefulClick = async (reviewId: number, hasLiked: boolean) => {
        if (disabledLikes[reviewId]) return
        setDisabledLikes(prev => ({ ...prev, [reviewId]: true }))
        try {
            if (hasLiked) {
                await unlikeReview(reviewId)
                setReviews(prev => prev.map(r => r.id === reviewId ? { ...r, usefulCount: Math.max((r.usefulCount ?? 1) - 1, 0), userHasLiked: false } : r))
            } else {
                await likeReview(reviewId)
                setReviews(prev => prev.map(r => r.id === reviewId ? { ...r, usefulCount: (r.usefulCount ?? 0) + 1, userHasLiked: true } : r))
            }
        } finally {
            setTimeout(() => setDisabledLikes(prev => ({ ...prev, [reviewId]: false })), 1000)
        }
    }

    useEffect(() => {
        fetchReviews(true)
    }, [profileId, sort])

    useEffect(() => {
        if (offset > 0) fetchReviews()
    }, [offset])

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            const target = e.target as HTMLElement
            if (!target.closest('.review-aspects-container')) setOpenAspects({})
        }
        document.addEventListener('click', handleClickOutside)
        return () => document.removeEventListener('click', handleClickOutside)
    }, [])

    useEffect(() => {
        if (isPageReset) {
            setIsPageReset(false)
        }
    }, [isPageReset])

    const isOwnProfile = user?.id?.toString() === profileId

    return (
        <section className="w-full mt-12 px-4">
            <div className="max-w-4xl mx-auto">
                <div className="flex flex-col gap-3 sm:flex-row sm:justify-between sm:items-center mb-6">
                    <h2 className="text-2xl font-bold text-base-content">Отзывы</h2>
                    <div className="flex items-center gap-3">
                        <button onClick={handleSortChange} className="btn btn-outline btn-sm">
                            {sort === 'newest' ? 'Сначала новые' : 'Сначала старые'}
                        </button>
                        {!userLoading && !isOwnProfile && (
                            <Link to={`/${type}/${profileId}/add-review`} className="btn btn-primary flex items-center gap-2">
                                <FiPlus size={18} /> Оставить отзыв
                            </Link>
                        )}
                    </div>
                </div>

                <div className="divider mb-8">Мнения пользователей</div>

                <AnimatePresence mode="wait">
                    {error && (
                        <motion.div
                            key="error"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.2, ease: 'easeInOut' }}
                            className="alert alert-error/70 bg-error/10 border-0 text-error mb-6 flex items-center justify-center"
                        >
                            <span>{error}</span>
                        </motion.div>
                    )}
                </AnimatePresence>

                {loading && reviews.length === 0 && (
                    <div className="space-y-6">{[...Array(3)].map((_, i) => <div key={i} className="animate-pulse bg-base-200 rounded-xl h-48"></div>)}</div>
                )}
                {!loading && !error && reviews.length === 0 && (
                    <div className="flex flex-col items-center justify-center p-12 rounded-xl border-2 border-base-300 bg-base-200/60 text-center">
                        <FaRegCommentDots className="text-5xl text-primary mb-4" />
                        <p className="text-gray-500 text-lg">Нет отзывов</p>
                    </div>
                )}

                <AnimatePresence mode="wait">
                    {!loading && !error && reviews.length > 0 && (
                        <motion.div
                            key={`${sort}-${offset}-${reviews.length}`}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.25, ease: 'easeInOut' }}
                            className="space-y-6"
                        >
                            {reviews.map(review => {
                                const formattedDate = new Date(review.created_at).toLocaleDateString('ru-RU', { year: 'numeric', month: 'long', day: 'numeric' })
                                const rating = Math.round(review.rating)
                                return (
                                    <motion.div
                                        key={review.id}
                                        layout
                                        initial={false}
                                        className="card bg-base-100 border-2 border-base-300 shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden"
                                    >
                                        <div className="card-body p-6 review-aspects-container">
                                            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4 mb-4">
                                                <div className="flex items-start gap-4 min-w-0 flex-1">
                                                    <div className="avatar flex-shrink-0">
                                                        <div className="w-16 rounded-full">
                                                            <img src={review.author?.avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${review.author?.name || 'anon'}`} alt="Аватар" className="object-cover" />
                                                        </div>
                                                    </div>
                                                    <div className="min-w-0">
                                                        <h4 className="font-bold text-lg">{review.author?.name || 'Аноним'}</h4>
                                                        <div className="flex items-center gap-2 mt-1">
                                                            <div className="flex items-center gap-1 text-yellow-500">
                                                                <span className="font-semibold">{rating}</span>
                                                                <FiStar size={16} className="fill-current" />
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="flex flex-wrap gap-3 justify-start sm:justify-end">
                                                    {review.pros.length > 0 && (
                                                        <button
                                                            onClick={e => {
                                                                e.stopPropagation()
                                                                setOpenAspects(prev => ({
                                                                    ...prev,
                                                                    [review.id]: prev[review.id] === 'pros' ? null : 'pros'
                                                                }))
                                                            }}
                                                            className={`btn btn-xs sm:btn-sm flex items-center gap-2 transition ${openAspects[review.id] === 'pros' ? 'btn-success' : 'btn-outline btn-success'}`}
                                                        >
                                                            <FiThumbsUp size={16} />
                                                            <span>{review.pros.length}</span>
                                                            <FiChevronDown size={14} className={`transition-transform ${openAspects[review.id] === 'pros' ? 'rotate-180' : ''}`} />
                                                        </button>
                                                    )}
                                                    {review.cons.length > 0 && (
                                                        <button
                                                            onClick={e => {
                                                                e.stopPropagation()
                                                                setOpenAspects(prev => ({
                                                                    ...prev,
                                                                    [review.id]: prev[review.id] === 'cons' ? null : 'cons'
                                                                }))
                                                            }}
                                                            className={`btn btn-xs sm:btn-sm flex items-center gap-2 transition ${openAspects[review.id] === 'cons' ? 'btn-error' : 'btn-outline btn-error'}`}
                                                        >
                                                            <FiThumbsDown size={16} />
                                                            <span>{review.cons.length}</span>
                                                            <FiChevronDown size={14} className={`transition-transform ${openAspects[review.id] === 'cons' ? 'rotate-180' : ''}`} />
                                                        </button>
                                                    )}
                                                </div>
                                            </div>

                                            <div>
                                                <AnimatePresence mode="wait">
                                                    {openAspects[review.id] === 'pros' && (
                                                        <motion.div
                                                            key="pros"
                                                            initial={{ height: 0, opacity: 0 }}
                                                            animate={{ height: 'auto', opacity: 1 }}
                                                            exit={{ height: 0, opacity: 0 }}
                                                            transition={{ duration: 0.25, ease: 'easeInOut' }}
                                                            className="mb-3 overflow-hidden"
                                                        >
                                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                                                {review.pros.map(pro => <ReviewAspectCard key={pro.id} aspect={pro} />)}
                                                            </div>
                                                        </motion.div>
                                                    )}
                                                    {openAspects[review.id] === 'cons' && (
                                                        <motion.div
                                                            key="cons"
                                                            initial={{ height: 0, opacity: 0 }}
                                                            animate={{ height: 'auto', opacity: 1 }}
                                                            exit={{ height: 0, opacity: 0 }}
                                                            transition={{ duration: 0.25, ease: 'easeInOut' }}
                                                            className="mb-3 overflow-hidden"
                                                        >
                                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                                                {review.cons.map(con => <ReviewAspectCard key={con.id} aspect={con} />)}
                                                            </div>
                                                        </motion.div>
                                                    )}
                                                </AnimatePresence>
                                            </div>

                                            <div className="relative">
                                                <p
                                                    className={`text-base text-base-content mb-4 break-words whitespace-pre-line transition-all duration-300
            ${expandedReviews[review.id] ? '' : 'line-clamp-5 overflow-hidden relative'}
        `}
                                                >
                                                    {review.text}
                                                </p>

                                                {!expandedReviews[review.id] && review.text.length > 300 && (
                                                    <div
                                                        className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-base-100 via-base-100/90 to-transparent flex items-end justify-center cursor-pointer"
                                                        onClick={() => setExpandedReviews(prev => ({ ...prev, [review.id]: true }))}
                                                    >
                                                        <span className="text-primary text-sm font-semibold">Прочитать дальше</span>
                                                    </div>
                                                )}

                                                {expandedReviews[review.id] && review.text.length > 300 && (
                                                    <div className="flex justify-center">
                                                        <button
                                                            onClick={() => setExpandedReviews(prev => ({ ...prev, [review.id]: false }))}
                                                            className="text-primary text-sm font-semibold mt-2"
                                                        >
                                                            Свернуть
                                                        </button>
                                                    </div>
                                                )}
                                            </div>

                                            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 pt-4 border-t border-base-300">
                                                <div className="hidden sm:block tooltip tooltip-right" data-tip="Был ли отзыв полезен?">
                                                    <button
                                                        disabled={disabledLikes[review.id] || !user}
                                                        onClick={() => handleUsefulClick(review.id, review.userHasLiked ?? false)}
                                                        className={`flex items-center gap-1 text-sm transition ${review.userHasLiked ? 'text-blue-600' : 'text-base-content/70 hover:text-base-content'}`}
                                                    >
                                                        <FiThumbsUp size={16} /> <span>{review.usefulCount ?? 0}</span>
                                                    </button>
                                                </div>

                                                <div className="sm:hidden">
                                                    <button
                                                        disabled={disabledLikes[review.id] || !user}
                                                        onClick={() => handleUsefulClick(review.id, review.userHasLiked ?? false)}
                                                        className={`flex items-center gap-1 text-sm transition ${review.userHasLiked ? 'text-blue-600' : 'text-base-content/70 hover:text-base-content'}`}
                                                    >
                                                        <FiThumbsUp size={16} /> <span>{review.usefulCount ?? 0}</span>
                                                    </button>
                                                </div>

                                                <span className="text-base-content/60 text-sm">{formattedDate}</span>
                                            </div>

                                        </div>
                                    </motion.div>
                                )
                            })}
                            {hasMore && (
                                <div className="flex justify-center">
                                    <button onClick={handleLoadMore} disabled={loading} className="btn btn-outline btn-primary">
                                        {loading ? <span className="loading loading-spinner loading-sm"></span> : 'Загрузить ещё'}
                                    </button>
                                </div>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </section>
    )
}