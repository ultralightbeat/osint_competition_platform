from datetime import date
from ..models import PlatformMetrics
from ..extensions import db


def collect_platform_metrics_for_day(day: date):
    m = PlatformMetrics.query.filter_by(date=day).first()
    if not m:
        m = PlatformMetrics(date=day)
        db.session.add(m)
    # TODO: fill metrics
    db.session.commit()
