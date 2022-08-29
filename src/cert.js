function Cert(cert, key, password) {
    this.cert = cert || null;
    this.key = key || null;
    this.password = password || null;
}
Cert.prototype.getKey = function () {
    return this.key;
}
Cert.prototype.setKey = function (key) {
    this.key = key;
}
Cert.prototype.getCert = function () {
    return this.cert;
}
Cert.prototype.setCert = function (cert) {
    this.cert = cert;
}
Cert.prototype.getPassword = function () {
    return this.password;
}
Cert.prototype.setPassword = function (password) {
    this.password = password;
}

Cert.prototype.equals = function (otherCert) {
    return otherCert.getCert() == this.getCert()
        && otherCert.getKey() == this.getKey() && otherCert.getPassword() == this.getPassword();
}
Cert.prototype.fill - function (newFields) {
    for (let field in newFields) {
        if (this.hasOwnProperty(field) && newFields.hasOwnProperty(field)) {
            if (this[field] !== 'undefined') {
                this[field] = newFields[field];
            }
        }
    }
}
module.exports = Cert