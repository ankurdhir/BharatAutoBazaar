bind = '0.0.0.0:8000'
workers = 3
worker_class = 'gthread'
threads = 2
timeout = 60
graceful_timeout = 30
max_requests = 1000
max_requests_jitter = 50
accesslog = '-'
errorlog = '-'
loglevel = 'info'


