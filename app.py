from flask import Flask, render_template, request, redirect, url_for, session
import secrets

app = Flask(__name__)
app.secret_key = secrets.token_hex(16) 

@app.route('/')
def home():
    return render_template('index.html')

@app.route('/about')
def about():
    return render_template('about.html')

@app.route('/place_order', methods=['POST'])
def place_order():
    session['order_data'] = {
        'flavor': request.form.get('flavor', 'Unknown'),
        'qty': request.form.get('qty', 1),
        'color': request.form.get('color', '#ff3030')
    }
    return redirect(url_for('confirmed'))

@app.route('/confirmed')
def confirmed():
    data = session.get('order_data')
    if not data:
        return redirect(url_for('home'))
    
    return render_template('order.html', 
                           flavor=data['flavor'], 
                           qty=data['qty'], 
                           color=data['color'])

if __name__ == '__main__':
    app.run(debug=True)