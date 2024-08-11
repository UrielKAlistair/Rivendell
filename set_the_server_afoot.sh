gnome-terminal --tab -- bash -c "~/go/bin/MailHog"
gnome-terminal --tab -- bash -c "redis-server"
gnome-terminal --tab -- bash -c "celery -A main.celery worker --loglevel=info"
gnome-terminal --tab -- bash -c "celery -A main.celery beat --loglevel=info"
python3 main.py