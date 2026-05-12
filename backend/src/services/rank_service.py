RANK_THRESHOLDS = [
    ("Student", 100),
    ("Chunin", 200),
    ("Ninja", 300),
    ("Samurai", 400),
    ("Ronin", 500),
    ("Monk", 600),
    ("Delighted", 700),
    ("Archangel", 800),
]


def get_rank_by_rating(rating: int | None) -> str:
    value = rating or 0
    current_rank = RANK_THRESHOLDS[0][0]
    for rank_name, min_rating in RANK_THRESHOLDS:
        if value >= min_rating:
            current_rank = rank_name
        else:
            break
    return current_rank
