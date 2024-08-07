from flask import render_template, current_app as app


@app.errorhandler(404)
def error_404(e):
    return render_template("404.html"), 404
