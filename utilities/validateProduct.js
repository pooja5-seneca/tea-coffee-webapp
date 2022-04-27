// import path from 'path';

module.exports.checkPrice = function (price) {
  var num = Number(price);
  if (num !== NaN) {
    if (num > 0) {
      return true;
    } else {
      return false;
    }
  } else {
    return false;
  }
}

module.exports.checkDiscount = function (discount) {
  var percent = Number(discount);
  if (percent !== NaN) {
    if (percent >= 0 && percent <= 100) {
      return true;
    } else {
      return false;
    }
  } else {
    return false;
  }
}

module.exports.checkName = function (name) {
  if (name === "" || name === null) {
    return false;
  } else {
    return true;
  }
}

module.exports.checkDesc = function (desc) {
  if (desc === "" || desc === null) {
    return false;
  } else {
    return true;
  }
}


module.exports.checkFile = function (filename) {

  let extension = filename.split(".").pop();
  if (extension !== null && extension.length > 2) {
    if (extension === "jpeg" || extension === "jpg" || extension === "png") {
      return true;
    } else {
      return false;
    }
  }
}