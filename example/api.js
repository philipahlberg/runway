const users = [{
  name: 'admin',
  password: 'admin',
  admin: true,
  signedIn: false
}];

const guest = { signedIn: false };

const products = {
  '1': { id: 1, name: 'Product A' },
  '2': { id: 2, name :'Product B' }
};

class API extends EventTarget {
  constructor() {
    super();
    this.user = guest;
  }

  emit(type) {
    this.dispatchEvent(new Event(type));
  }

  getUser() {
    return this.user;
  }

  signIn(name, password) {
    this.user = users
      .find(user => 
        user.name === name &&
        user.password === password
      );

    if (this.user) {
      this.user.signedIn = true;
      this.emit('sign-in');
      return true;
    } else {
      this.user = guest;
      return false;
    }
  }

  signOut() {
    this.user.signedIn = false;
    this.user = guest;
    this.emit('sign-out');
  }

  signUp(name, password) {
    users.push({
      name,
      password,
      admin: false,
      signedIn: false
    });
    this.emit('sign-up');
  }

  getProducts() {
    return Object.values(products);
  }

  getProduct(id) {
    return products[id];
  }

  addProduct(id, name) {
    products[id] = { id, name };
    this.emit('add-product');
  }
}

export default new API();