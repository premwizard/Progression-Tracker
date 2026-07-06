import logging
import sys

from app.core.config import settings


def setup_logging():
    logging.basicConfig(
        stream=sys.stdout,
        level=logging.INFO,
        format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    )
    logger = logging.getLogger(settings.PROJECT_NAME)
    return logger

logger = setup_logging()
