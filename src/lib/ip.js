//var Buffer = require('buffer').Buffer;
var os = require('os');

var factory = function () {
    var self = this;

    function normalizeFamily(family) {
        var fam = (family) ? family.toLowerCase() : 'ipv4';
        if (fam != 'ipv4' && fam != 'ipv6') { fam = 'ipv4'; }
        return fam;
    }

    self.getInterfaces = function(options) {
        var ifaces = [];

        // put all interfaces in a flat array
        var objInterfaces = os.networkInterfaces();
        Object.keys(objInterfaces).forEach(function (nic) {
            objInterfaces[nic].forEach(function (el, idx, arr) {
                ifaces.push({ nic: nic, address: el.address, netmask: el.netmask, family: normalizeFamily(el.family), mac: el.mac, internal: el.internal });
            });
        });

        // filters
        if (options && options.nic !== undefined) {
            ifaces = ifaces.filter(function (value) { return (value.nic == options.nic); });
        }        
        if (options && options.family !== undefined) {
            ifaces = ifaces.filter(function (value) { return (value.family == normalizeFamily(options.family)); });
        }
        if (options && options.mac !== undefined) {
            ifaces = ifaces.filter(function (value) { return (value.mac == options.mac); });
        }
        if (options && options.internal !== undefined) {
            ifaces = ifaces.filter(function (value) { return (value.internal == options.internal); });
        }
        
        return ifaces;
    }
    self.getIP = function (family) {
        var ips = self.getIPs(family);
        return (ips.length > 0) ? ips[0] : self.getLoopbackIP(family);
    }
    self.getIPs = function (family) { 
        var fam = normalizeFamily(family);
        var ifaces = self.getInterfaces({ family: fam, internal: false });
        var ips = ifaces.map(function (iface) { return iface.address; });
        return ips;
    }
    self.getLoopbackIP = function(family) {
        var fam = normalizeFamily(family);
        if (fam == 'ipv6') { 
            return 'fe80::1';
        } else { 
            return '127.0.0.1';
        }
    };

}
module.exports = new factory();






//var ip = exports;

//ip.toBuffer = function toBuffer(ip, buff, offset) {
//    offset = ~~offset;
    
//    var result;
    
//    if (this.isV4Format(ip)) {
//        result = buff || new Buffer(offset + 4);
//        ip.split(/\./g).map(function (byte) {
//            result[offset++] = parseInt(byte, 10) & 0xff;
//        });
//    } else if (this.isV6Format(ip)) {
//        var sections = ip.split(':', 8);
        
//        var i;
//        for (i = 0; i < sections.length; i++) {
//            var isv4 = this.isV4Format(sections[i]);
//            var v4Buffer;
            
//            if (isv4) {
//                v4Buffer = this.toBuffer(sections[i]);
//                sections[i] = v4Buffer.slice(0, 2).toString('hex');
//            }
            
//            if (v4Buffer && ++i < 8) {
//                sections.splice(i, 0, v4Buffer.slice(2, 4).toString('hex'));
//            }
//        }
        
//        if (sections[0] === '') {
//            while (sections.length < 8) sections.unshift('0');
//        } else if (sections[sections.length - 1] === '') {
//            while (sections.length < 8) sections.push('0');
//        } else if (sections.length < 8) {
//            for (i = 0; i < sections.length && sections[i] !== ''; i++)            ;
//            var argv = [i, 1];
//            for (i = 9 - sections.length; i > 0; i--) {
//                argv.push('0');
//            }
//            sections.splice.apply(sections, argv);
//        }
        
//        result = buff || new Buffer(offset + 16);
//        for (i = 0; i < sections.length; i++) {
//            var word = parseInt(sections[i], 16);
//            result[offset++] = (word >> 8) & 0xff;
//            result[offset++] = word & 0xff;
//        }
//    }
    
//    if (!result) {
//        throw Error('Invalid ip address: ' + ip);
//    }
    
//    return result;
//};

//ip.toString = function toString(buff, offset, length) {
//    offset = ~~offset;
//    length = length || (buff.length - offset);
    
//    var result = [];
//    if (length === 4) {
//        // IPv4
//        for (var i = 0; i < length; i++) {
//            result.push(buff[offset + i]);
//        }
//        result = result.join('.');
//    } else if (length === 16) {
//        // IPv6
//        for (var i = 0; i < length; i += 2) {
//            result.push(buff.readUInt16BE(offset + i).toString(16));
//        }
//        result = result.join(':');
//        result = result.replace(/(^|:)0(:0)*:0(:|$)/, '$1::$3');
//        result = result.replace(/:{3,4}/, '::');
//    }
    
//    return result;
//};

//var ipv4Regex = /^(\d{1,3}\.){3,3}\d{1,3}$/;
//var ipv6Regex =
// /^(::)?(((\d{1,3}\.){3}(\d{1,3}){1})?([0-9a-f]){0,4}:{0,2}){1,8}(::)?$/i;

//ip.isV4Format = function isV4Format(ip) {
//    return ipv4Regex.test(ip);
//};

//ip.isV6Format = function isV6Format(ip) {
//    return ipv6Regex.test(ip);
//};


//ip.fromPrefixLen = function fromPrefixLen(prefixlen, family) {
//    if (prefixlen > 32) {
//        family = 'ipv6';
//    } else {
//        family = _normalizeFamily(family);
//    }
    
//    var len = 4;
//    if (family === 'ipv6') {
//        len = 16;
//    }
//    var buff = new Buffer(len);
    
//    for (var i = 0, n = buff.length; i < n; ++i) {
//        var bits = 8;
//        if (prefixlen < 8) {
//            bits = prefixlen;
//        }
//        prefixlen -= bits;
        
//        buff[i] = ~(0xff >> bits);
//    }
    
//    return ip.toString(buff);
//};

//ip.mask = function mask(addr, mask) {
//    addr = ip.toBuffer(addr);
//    mask = ip.toBuffer(mask);
    
//    var result = new Buffer(Math.max(addr.length, mask.length));
    
//    // Same protocol - do bitwise and
//    if (addr.length === mask.length) {
//        for (var i = 0; i < addr.length; i++) {
//            result[i] = addr[i] & mask[i];
//        }
//    } else if (mask.length === 4) {
//        // IPv6 address and IPv4 mask
//        // (Mask low bits)
//        for (var i = 0; i < mask.length; i++) {
//            result[i] = addr[addr.length - 4 + i] & mask[i];
//        }
//    } else {
//        // IPv6 mask and IPv4 addr
//        for (var i = 0; i < result.length - 6; i++) {
//            result[i] = 0;
//        }
        
//        // ::ffff:ipv4
//        result[10] = 0xff;
//        result[11] = 0xff;
//        for (var i = 0; i < addr.length; i++) {
//            result[i + 12] = addr[i] & mask[i + 12];
//        }
//    }
    
//    return ip.toString(result);
//};

//ip.cidr = function cidr(cidrString) {
//    var cidrParts = cidrString.split('/');
    
//    var addr = cidrParts[0];
//    if (cidrParts.length !== 2)
//        throw new Error('invalid CIDR subnet: ' + addr);
    
//    var mask = ip.fromPrefixLen(parseInt(cidrParts[1], 10));
    
//    return ip.mask(addr, mask);
//};

//ip.subnet = function subnet(addr, mask) {
//    var networkAddress = ip.toLong(ip.mask(addr, mask));
    
//    // Calculate the mask's length.
//    var maskBuffer = ip.toBuffer(mask);
//    var maskLength = 0;
    
//    for (var i = 0; i < maskBuffer.length; i++) {
//        if (maskBuffer[i] === 0xff) {
//            maskLength += 8;
//        } else {
//            var octet = maskBuffer[i] & 0xff;
//            while (octet) {
//                octet = (octet << 1) & 0xff;
//                maskLength++;
//            }
//        }
//    }
    
//    var numberOfAddresses = Math.pow(2, 32 - maskLength);
    
//    return {
//        networkAddress: ip.fromLong(networkAddress),
//        firstAddress: numberOfAddresses <= 2 ?
//                    ip.fromLong(networkAddress) :
//                    ip.fromLong(networkAddress + 1),
//        lastAddress: numberOfAddresses <= 2 ?
//                    ip.fromLong(networkAddress + numberOfAddresses - 1) :
//                    ip.fromLong(networkAddress + numberOfAddresses - 2),
//        broadcastAddress: ip.fromLong(networkAddress + numberOfAddresses - 1),
//        subnetMask: mask,
//        subnetMaskLength: maskLength,
//        numHosts: numberOfAddresses <= 2 ?
//                numberOfAddresses : numberOfAddresses - 2,
//        length: numberOfAddresses
//    };
//};

//ip.cidrSubnet = function cidrSubnet(cidrString) {
//    var cidrParts = cidrString.split('/');
    
//    var addr = cidrParts[0];
//    if (cidrParts.length !== 2)
//        throw new Error('invalid CIDR subnet: ' + addr);
    
//    var mask = ip.fromPrefixLen(parseInt(cidrParts[1], 10));
    
//    return ip.subnet(addr, mask);
//};

//ip.not = function not(addr) {
//    var buff = ip.toBuffer(addr);
//    for (var i = 0; i < buff.length; i++) {
//        buff[i] = 0xff ^ buff[i];
//    }
//    return ip.toString(buff);
//};

//ip.or = function or(a, b) {
//    a = ip.toBuffer(a);
//    b = ip.toBuffer(b);
    
//    // same protocol
//    if (a.length === b.length) {
//        for (var i = 0; i < a.length; ++i) {
//            a[i] |= b[i];
//        }
//        return ip.toString(a);

//  // mixed protocols
//    } else {
//        var buff = a;
//        var other = b;
//        if (b.length > a.length) {
//            buff = b;
//            other = a;
//        }
        
//        var offset = buff.length - other.length;
//        for (var i = offset; i < buff.length; ++i) {
//            buff[i] |= other[i - offset];
//        }
        
//        return ip.toString(buff);
//    }
//};

//ip.isEqual = function isEqual(a, b) {
//    a = ip.toBuffer(a);
//    b = ip.toBuffer(b);
    
//    // Same protocol
//    if (a.length === b.length) {
//        for (var i = 0; i < a.length; i++) {
//            if (a[i] !== b[i]) return false;
//        }
//        return true;
//    }
    
//    // Swap
//    if (b.length === 4) {
//        var t = b;
//        b = a;
//        a = t;
//    }
    
//    // a - IPv4, b - IPv6
//    for (var i = 0; i < 10; i++) {
//        if (b[i] !== 0) return false;
//    }
    
//    var word = b.readUInt16BE(10);
//    if (word !== 0 && word !== 0xffff) return false;
    
//    for (var i = 0; i < 4; i++) {
//        if (a[i] !== b[i + 12]) return false;
//    }
    
//    return true;
//};

//ip.isPrivate = function isPrivate(addr) {
//    return /^(::f{4}:)?10\.([0-9]{1,3})\.([0-9]{1,3})\.([0-9]{1,3})$/
//      .test(addr) ||
//    /^(::f{4}:)?192\.168\.([0-9]{1,3})\.([0-9]{1,3})$/.test(addr) ||
//    /^(::f{4}:)?172\.(1[6-9]|2\d|30|31)\.([0-9]{1,3})\.([0-9]{1,3})$/
//      .test(addr) ||
//    /^(::f{4}:)?127\.([0-9]{1,3})\.([0-9]{1,3})\.([0-9]{1,3})$/.test(addr) ||
//    /^(::f{4}:)?169\.254\.([0-9]{1,3})\.([0-9]{1,3})$/.test(addr) ||
//    /^fc00:/i.test(addr) ||
//    /^fe80:/i.test(addr) ||
//    /^::1$/.test(addr) ||
//    /^::$/.test(addr);
//};

//ip.isPublic = function isPublic(addr) {
//    return !ip.isPrivate(addr);
//};

//ip.isLoopback = function isLoopback(addr) {
//    return /^(::f{4}:)?127\.([0-9]{1,3})\.([0-9]{1,3})\.([0-9]{1,3})/
//      .test(addr) ||
//    /^fe80::1$/.test(addr) ||
//    /^::1$/.test(addr) ||
//    /^::$/.test(addr);
//};




//ip.toLong = function toInt(ip) {
//    var ipl = 0;
//    ip.split('.').forEach(function (octet) {
//        ipl <<= 8;
//        ipl += parseInt(octet);
//    });
//    return (ipl >>> 0);
//};

//ip.fromLong = function fromInt(ipl) {
//    return ((ipl >>> 24) + '.' +
//      (ipl >> 16 & 255) + '.' +
//      (ipl >> 8 & 255) + '.' +
//      (ipl & 255));
//};