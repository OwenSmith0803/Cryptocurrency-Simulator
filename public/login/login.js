async function sign_up() {

  let has_account = localStorage.getItem('has_account');
  has_account = (has_account == 'true');

  if(has_account == undefined || has_account == false) {

    let name = prompt('Enter your name: ');
    if(name == "" || name == undefined) return;

    let password = prompt('Enter your password: ');
    if(password == "" || password == undefined) return;

    let data = {
      name: name,
      password: password
    }

    const options = {
      method: 'POST',
      body: JSON.stringify(data),
      headers: {'Content-Type': 'application/json'}
    }

    const response = await fetch('/add_user', options);
    const json = await response.json();

    if(!json.success) {
      alert(`Somebody has already chosen the name ${name}!`);
    } else if(!json.isAdmin) {
      alert('Account successfully created!');
    } else {
      alert('Admin account successfully created!');
    }

    localStorage.setItem('has_account', json.success);

  } else {
    alert('You already have an account!');
  }

}

async function login() {

  let name = prompt('Enter your name: ');
  if(name == "" || name == undefined) return;

  let password = prompt('Enter your password: ');
  if(password == "" || password == undefined) return;

  const response = await fetch(`/users/${name}/${password}`);
  const json = await response.json();

  if(json.money !== undefined && !json.isAdmin) {
    window.location.replace('/main/main.html');
  } else if(json.money !== undefined && json.isAdmin) {
    window.location.replace('/admin/admin.html');
  } else {
    alert('Username or password is incorrect!');
  }

}
