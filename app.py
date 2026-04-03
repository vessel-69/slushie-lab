from flask import Flask, render_template, request
import os

app = Flask(__name__)

@app.route('/favicon.ico')
def favicon():
    return '', 204

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/about')
def about():
    return render_template('about.html')

@app.route('/lab')
def lab():
    return render_template('lab.html')

@app.route('/order')
def order():
    flavor = request.args.get('flavor', 'Mystery')
    color  = request.args.get('color',  '#ff2d2d')
    qty    = request.args.get('qty',    '1')
    return render_template('order.html', flavor=flavor, color=color, qty=qty)

if __name__ == '__main__':
    app.run(debug=True)