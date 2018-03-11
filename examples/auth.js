const users = [{
  name: 'admin',
  password: 'admin',
  admin: true,
  signedIn: false
}];

export let user = {};

export function signin(name, password) {
  user = users
    .find(user => 
      user.name === name &&
      user.password === password
    );

  if (user) {
    user.signedIn = true;
    return true;
  } else {
    return false;
  }
}

export function signout() {
  user.signedIn = false;
}

export function signup(name, password) {
  users.push({
    name,
    password,
    admin: false,
    signedIn: false
  });
}
