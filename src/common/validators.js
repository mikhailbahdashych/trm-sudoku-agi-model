exports.validateEmail = (email) => {
  if (email) {
    const regex = new RegExp('[a-z0-9!#$%&\'*+/=?^_`{|}~-]+(?:\\.[a-z0-9!#$%&\'*+/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?')
    return regex.test(email);
  } else if (email === '') {
    return 1
  } else {
    return null
  }
}

exports.validatePassword = (password) => {
  if (password) {
    const regex = new RegExp("^(?=.*?[A-Z])(?=.*?[a-z])(?=.*?[0-9])(?=.*?[#?!@$%^&*-]).{8,}$")
    return regex.test(password)
  } else {
    return null
  }
}

exports.validateUserPersonalId = (id) => {
  const regex = new RegExp('^\\d{10}$')
  return regex.test(id)
}
