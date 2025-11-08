import logging
import sys
from logging.handlers import TimedRotatingFileHandler

def setup_logging():
    logger = logging.getLogger("ex_engine")
    logger.setLevel(logging.INFO)

    # Create a handler that writes log records to a file, rotating daily
    file_handler = TimedRotatingFileHandler("ex_engine.log", when="midnight", interval=1, backupCount=7)
    file_handler.setFormatter(logging.Formatter('%(asctime)s - %(name)s - %(levelname)s - %(message)s'))

    # Create a handler that writes log records to stderr
    stream_handler = logging.StreamHandler(sys.stdout)
    stream_handler.setFormatter(logging.Formatter('%(asctime)s - %(name)s - %(levelname)s - %(message)s'))

    logger.addHandler(file_handler)
    logger.addHandler(stream_handler)

    return logger

logger = setup_logging()
