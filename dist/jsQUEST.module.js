let numeric = {};
numeric.version = "1.2.6";

// 1. Utility functions
numeric.bench = function bench (f,interval) {
    var t1,t2,n,i;
    if(typeof interval === "undefined") { interval = 15; }
    n = 0.5;
    t1 = new Date();
    while(1) {
        n*=2;
        for(i=n;i>3;i-=4) { f(); f(); f(); f(); }
        while(i>0) { f(); i--; }
        t2 = new Date();
        if(t2-t1 > interval) break;
    }
    for(i=n;i>3;i-=4) { f(); f(); f(); f(); }
    while(i>0) { f(); i--; }
    t2 = new Date();
    return 1000*(3*n-1)/(t2-t1);
};

numeric._myIndexOf = (function _myIndexOf(w) {
    var n = this.length,k;
    for(k=0;k<n;++k) if(this[k]===w) return k;
    return -1;
});
numeric.myIndexOf = (Array.prototype.indexOf)?Array.prototype.indexOf:numeric._myIndexOf;

numeric.Function = Function;
numeric.precision = 4;
numeric.largeArray = 50;

numeric.prettyPrint = function prettyPrint(x) {
    function fmtnum(x) {
        if(x === 0) { return '0'; }
        if(isNaN(x)) { return 'NaN'; }
        if(x<0) { return '-'+fmtnum(-x); }
        if(isFinite(x)) {
            var scale = Math.floor(Math.log(x) / Math.log(10));
            var normalized = x / Math.pow(10,scale);
            var basic = normalized.toPrecision(numeric.precision);
            if(parseFloat(basic) === 10) { scale++; normalized = 1; basic = normalized.toPrecision(numeric.precision); }
            return parseFloat(basic).toString()+'e'+scale.toString();
        }
        return 'Infinity';
    }
    var ret = [];
    function foo(x) {
        var k;
        if(typeof x === "undefined") { ret.push(Array(numeric.precision+8).join(' ')); return false; }
        if(typeof x === "string") { ret.push('"'+x+'"'); return false; }
        if(typeof x === "boolean") { ret.push(x.toString()); return false; }
        if(typeof x === "number") {
            var a = fmtnum(x);
            var b = x.toPrecision(numeric.precision);
            var c = parseFloat(x.toString()).toString();
            var d = [a,b,c,parseFloat(b).toString(),parseFloat(c).toString()];
            for(k=1;k<d.length;k++) { if(d[k].length < a.length) a = d[k]; }
            ret.push(Array(numeric.precision+8-a.length).join(' ')+a);
            return false;
        }
        if(x === null) { ret.push("null"); return false; }
        if(typeof x === "function") { 
            ret.push(x.toString());
            var flag = false;
            for(k in x) { if(x.hasOwnProperty(k)) { 
                if(flag) ret.push(',\n');
                else ret.push('\n{');
                flag = true; 
                ret.push(k); 
                ret.push(': \n'); 
                foo(x[k]); 
            } }
            if(flag) ret.push('}\n');
            return true;
        }
        if(x instanceof Array) {
            if(x.length > numeric.largeArray) { ret.push('...Large Array...'); return true; }
            var flag = false;
            ret.push('[');
            for(k=0;k<x.length;k++) { if(k>0) { ret.push(','); if(flag) ret.push('\n '); } flag = foo(x[k]); }
            ret.push(']');
            return true;
        }
        ret.push('{');
        var flag = false;
        for(k in x) { if(x.hasOwnProperty(k)) { if(flag) ret.push(',\n'); flag = true; ret.push(k); ret.push(': \n'); foo(x[k]); } }
        ret.push('}');
        return true;
    }
    foo(x);
    return ret.join('');
};

numeric.parseDate = function parseDate(d) {
    function foo(d) {
        if(typeof d === 'string') { return Date.parse(d.replace(/-/g,'/')); }
        if(!(d instanceof Array)) { throw new Error("parseDate: parameter must be arrays of strings"); }
        var ret = [],k;
        for(k=0;k<d.length;k++) { ret[k] = foo(d[k]); }
        return ret;
    }
    return foo(d);
};

numeric.parseFloat = function parseFloat_(d) {
    function foo(d) {
        if(typeof d === 'string') { return parseFloat(d); }
        if(!(d instanceof Array)) { throw new Error("parseFloat: parameter must be arrays of strings"); }
        var ret = [],k;
        for(k=0;k<d.length;k++) { ret[k] = foo(d[k]); }
        return ret;
    }
    return foo(d);
};

numeric.parseCSV = function parseCSV(t) {
    var foo = t.split('\n');
    var j,k;
    var ret = [];
    var pat = /(([^'",]*)|('[^']*')|("[^"]*")),/g;
    var patnum = /^\s*(([+-]?[0-9]+(\.[0-9]*)?(e[+-]?[0-9]+)?)|([+-]?[0-9]*(\.[0-9]+)?(e[+-]?[0-9]+)?))\s*$/;
    var stripper = function(n) { return n.substr(0,n.length-1); };
    var count = 0;
    for(k=0;k<foo.length;k++) {
      var bar = (foo[k]+",").match(pat),baz;
      if(bar.length>0) {
          ret[count] = [];
          for(j=0;j<bar.length;j++) {
              baz = stripper(bar[j]);
              if(patnum.test(baz)) { ret[count][j] = parseFloat(baz); }
              else ret[count][j] = baz;
          }
          count++;
      }
    }
    return ret;
};

numeric.toCSV = function toCSV(A) {
    var s = numeric.dim(A);
    var i,j,m,row,ret;
    m = s[0];
    ret = [];
    for(i=0;i<m;i++) {
        row = [];
        for(j=0;j<m;j++) { row[j] = A[i][j].toString(); }
        ret[i] = row.join(', ');
    }
    return ret.join('\n')+'\n';
};

numeric.getURL = function getURL(url) {
    var client = new XMLHttpRequest();
    client.open("GET",url,false);
    client.send();
    return client;
};

numeric.imageURL = function imageURL(img) {
    function base64(A) {
        var n = A.length, i,x,y,z,p,q,r,s;
        var key = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";
        var ret = "";
        for(i=0;i<n;i+=3) {
            x = A[i];
            y = A[i+1];
            z = A[i+2];
            p = x >> 2;
            q = ((x & 3) << 4) + (y >> 4);
            r = ((y & 15) << 2) + (z >> 6);
            s = z & 63;
            if(i+1>=n) { r = s = 64; }
            else if(i+2>=n) { s = 64; }
            ret += key.charAt(p) + key.charAt(q) + key.charAt(r) + key.charAt(s);
            }
        return ret;
    }
    function crc32Array (a,from,to) {
        if(typeof from === "undefined") { from = 0; }
        if(typeof to === "undefined") { to = a.length; }
        var table = [0x00000000, 0x77073096, 0xEE0E612C, 0x990951BA, 0x076DC419, 0x706AF48F, 0xE963A535, 0x9E6495A3,
                     0x0EDB8832, 0x79DCB8A4, 0xE0D5E91E, 0x97D2D988, 0x09B64C2B, 0x7EB17CBD, 0xE7B82D07, 0x90BF1D91, 
                     0x1DB71064, 0x6AB020F2, 0xF3B97148, 0x84BE41DE, 0x1ADAD47D, 0x6DDDE4EB, 0xF4D4B551, 0x83D385C7,
                     0x136C9856, 0x646BA8C0, 0xFD62F97A, 0x8A65C9EC, 0x14015C4F, 0x63066CD9, 0xFA0F3D63, 0x8D080DF5, 
                     0x3B6E20C8, 0x4C69105E, 0xD56041E4, 0xA2677172, 0x3C03E4D1, 0x4B04D447, 0xD20D85FD, 0xA50AB56B, 
                     0x35B5A8FA, 0x42B2986C, 0xDBBBC9D6, 0xACBCF940, 0x32D86CE3, 0x45DF5C75, 0xDCD60DCF, 0xABD13D59, 
                     0x26D930AC, 0x51DE003A, 0xC8D75180, 0xBFD06116, 0x21B4F4B5, 0x56B3C423, 0xCFBA9599, 0xB8BDA50F,
                     0x2802B89E, 0x5F058808, 0xC60CD9B2, 0xB10BE924, 0x2F6F7C87, 0x58684C11, 0xC1611DAB, 0xB6662D3D,
                     0x76DC4190, 0x01DB7106, 0x98D220BC, 0xEFD5102A, 0x71B18589, 0x06B6B51F, 0x9FBFE4A5, 0xE8B8D433,
                     0x7807C9A2, 0x0F00F934, 0x9609A88E, 0xE10E9818, 0x7F6A0DBB, 0x086D3D2D, 0x91646C97, 0xE6635C01, 
                     0x6B6B51F4, 0x1C6C6162, 0x856530D8, 0xF262004E, 0x6C0695ED, 0x1B01A57B, 0x8208F4C1, 0xF50FC457, 
                     0x65B0D9C6, 0x12B7E950, 0x8BBEB8EA, 0xFCB9887C, 0x62DD1DDF, 0x15DA2D49, 0x8CD37CF3, 0xFBD44C65, 
                     0x4DB26158, 0x3AB551CE, 0xA3BC0074, 0xD4BB30E2, 0x4ADFA541, 0x3DD895D7, 0xA4D1C46D, 0xD3D6F4FB, 
                     0x4369E96A, 0x346ED9FC, 0xAD678846, 0xDA60B8D0, 0x44042D73, 0x33031DE5, 0xAA0A4C5F, 0xDD0D7CC9, 
                     0x5005713C, 0x270241AA, 0xBE0B1010, 0xC90C2086, 0x5768B525, 0x206F85B3, 0xB966D409, 0xCE61E49F, 
                     0x5EDEF90E, 0x29D9C998, 0xB0D09822, 0xC7D7A8B4, 0x59B33D17, 0x2EB40D81, 0xB7BD5C3B, 0xC0BA6CAD, 
                     0xEDB88320, 0x9ABFB3B6, 0x03B6E20C, 0x74B1D29A, 0xEAD54739, 0x9DD277AF, 0x04DB2615, 0x73DC1683, 
                     0xE3630B12, 0x94643B84, 0x0D6D6A3E, 0x7A6A5AA8, 0xE40ECF0B, 0x9309FF9D, 0x0A00AE27, 0x7D079EB1, 
                     0xF00F9344, 0x8708A3D2, 0x1E01F268, 0x6906C2FE, 0xF762575D, 0x806567CB, 0x196C3671, 0x6E6B06E7, 
                     0xFED41B76, 0x89D32BE0, 0x10DA7A5A, 0x67DD4ACC, 0xF9B9DF6F, 0x8EBEEFF9, 0x17B7BE43, 0x60B08ED5, 
                     0xD6D6A3E8, 0xA1D1937E, 0x38D8C2C4, 0x4FDFF252, 0xD1BB67F1, 0xA6BC5767, 0x3FB506DD, 0x48B2364B, 
                     0xD80D2BDA, 0xAF0A1B4C, 0x36034AF6, 0x41047A60, 0xDF60EFC3, 0xA867DF55, 0x316E8EEF, 0x4669BE79, 
                     0xCB61B38C, 0xBC66831A, 0x256FD2A0, 0x5268E236, 0xCC0C7795, 0xBB0B4703, 0x220216B9, 0x5505262F, 
                     0xC5BA3BBE, 0xB2BD0B28, 0x2BB45A92, 0x5CB36A04, 0xC2D7FFA7, 0xB5D0CF31, 0x2CD99E8B, 0x5BDEAE1D, 
                     0x9B64C2B0, 0xEC63F226, 0x756AA39C, 0x026D930A, 0x9C0906A9, 0xEB0E363F, 0x72076785, 0x05005713, 
                     0x95BF4A82, 0xE2B87A14, 0x7BB12BAE, 0x0CB61B38, 0x92D28E9B, 0xE5D5BE0D, 0x7CDCEFB7, 0x0BDBDF21, 
                     0x86D3D2D4, 0xF1D4E242, 0x68DDB3F8, 0x1FDA836E, 0x81BE16CD, 0xF6B9265B, 0x6FB077E1, 0x18B74777, 
                     0x88085AE6, 0xFF0F6A70, 0x66063BCA, 0x11010B5C, 0x8F659EFF, 0xF862AE69, 0x616BFFD3, 0x166CCF45, 
                     0xA00AE278, 0xD70DD2EE, 0x4E048354, 0x3903B3C2, 0xA7672661, 0xD06016F7, 0x4969474D, 0x3E6E77DB, 
                     0xAED16A4A, 0xD9D65ADC, 0x40DF0B66, 0x37D83BF0, 0xA9BCAE53, 0xDEBB9EC5, 0x47B2CF7F, 0x30B5FFE9, 
                     0xBDBDF21C, 0xCABAC28A, 0x53B39330, 0x24B4A3A6, 0xBAD03605, 0xCDD70693, 0x54DE5729, 0x23D967BF, 
                     0xB3667A2E, 0xC4614AB8, 0x5D681B02, 0x2A6F2B94, 0xB40BBE37, 0xC30C8EA1, 0x5A05DF1B, 0x2D02EF8D];
     
        var crc = -1, y = 0; a.length;var i;

        for (i = from; i < to; i++) {
            y = (crc ^ a[i]) & 0xFF;
            crc = (crc >>> 8) ^ table[y];
        }
     
        return crc ^ (-1);
    }

    var h = img[0].length, w = img[0][0].length, s1, s2, k,length,a,b,i,j,adler32,crc32;
    var stream = [
                  137, 80, 78, 71, 13, 10, 26, 10,                           //  0: PNG signature
                  0,0,0,13,                                                  //  8: IHDR Chunk length
                  73, 72, 68, 82,                                            // 12: "IHDR" 
                  (w >> 24) & 255, (w >> 16) & 255, (w >> 8) & 255, w&255,   // 16: Width
                  (h >> 24) & 255, (h >> 16) & 255, (h >> 8) & 255, h&255,   // 20: Height
                  8,                                                         // 24: bit depth
                  2,                                                         // 25: RGB
                  0,                                                         // 26: deflate
                  0,                                                         // 27: no filter
                  0,                                                         // 28: no interlace
                  -1,-2,-3,-4,                                               // 29: CRC
                  -5,-6,-7,-8,                                               // 33: IDAT Chunk length
                  73, 68, 65, 84,                                            // 37: "IDAT"
                  // RFC 1950 header starts here
                  8,                                                         // 41: RFC1950 CMF
                  29                                                         // 42: RFC1950 FLG
                  ];
    crc32 = crc32Array(stream,12,29);
    stream[29] = (crc32>>24)&255;
    stream[30] = (crc32>>16)&255;
    stream[31] = (crc32>>8)&255;
    stream[32] = (crc32)&255;
    s1 = 1;
    s2 = 0;
    for(i=0;i<h;i++) {
        if(i<h-1) { stream.push(0); }
        else { stream.push(1); }
        a = (3*w+1+(i===0))&255; b = ((3*w+1+(i===0))>>8)&255;
        stream.push(a); stream.push(b);
        stream.push((~a)&255); stream.push((~b)&255);
        if(i===0) stream.push(0);
        for(j=0;j<w;j++) {
            for(k=0;k<3;k++) {
                a = img[k][i][j];
                if(a>255) a = 255;
                else if(a<0) a=0;
                else a = Math.round(a);
                s1 = (s1 + a )%65521;
                s2 = (s2 + s1)%65521;
                stream.push(a);
            }
        }
        stream.push(0);
    }
    adler32 = (s2<<16)+s1;
    stream.push((adler32>>24)&255);
    stream.push((adler32>>16)&255);
    stream.push((adler32>>8)&255);
    stream.push((adler32)&255);
    length = stream.length - 41;
    stream[33] = (length>>24)&255;
    stream[34] = (length>>16)&255;
    stream[35] = (length>>8)&255;
    stream[36] = (length)&255;
    crc32 = crc32Array(stream,37);
    stream.push((crc32>>24)&255);
    stream.push((crc32>>16)&255);
    stream.push((crc32>>8)&255);
    stream.push((crc32)&255);
    stream.push(0);
    stream.push(0);
    stream.push(0);
    stream.push(0);
//    a = stream.length;
    stream.push(73);  // I
    stream.push(69);  // E
    stream.push(78);  // N
    stream.push(68);  // D
    stream.push(174); // CRC1
    stream.push(66);  // CRC2
    stream.push(96);  // CRC3
    stream.push(130); // CRC4
    return 'data:image/png;base64,'+base64(stream);
};

// 2. Linear algebra with Arrays.
numeric._dim = function _dim(x) {
    var ret = [];
    while(typeof x === "object") { ret.push(x.length); x = x[0]; }
    return ret;
};

numeric.dim = function dim(x) {
    var y,z;
    if(typeof x === "object") {
        y = x[0];
        if(typeof y === "object") {
            z = y[0];
            if(typeof z === "object") {
                return numeric._dim(x);
            }
            return [x.length,y.length];
        }
        return [x.length];
    }
    return [];
};

numeric.mapreduce = function mapreduce(body,init) {
    return Function('x','accum','_s','_k',
            'if(typeof accum === "undefined") accum = '+init+';\n'+
            'if(typeof x === "number") { var xi = x; '+body+'; return accum; }\n'+
            'if(typeof _s === "undefined") _s = numeric.dim(x);\n'+
            'if(typeof _k === "undefined") _k = 0;\n'+
            'var _n = _s[_k];\n'+
            'var i,xi;\n'+
            'if(_k < _s.length-1) {\n'+
            '    for(i=_n-1;i>=0;i--) {\n'+
            '        accum = arguments.callee(x[i],accum,_s,_k+1);\n'+
            '    }'+
            '    return accum;\n'+
            '}\n'+
            'for(i=_n-1;i>=1;i-=2) { \n'+
            '    xi = x[i];\n'+
            '    '+body+';\n'+
            '    xi = x[i-1];\n'+
            '    '+body+';\n'+
            '}\n'+
            'if(i === 0) {\n'+
            '    xi = x[i];\n'+
            '    '+body+'\n'+
            '}\n'+
            'return accum;'
            );
};
numeric.mapreduce2 = function mapreduce2(body,setup) {
    return Function('x',
            'var n = x.length;\n'+
            'var i,xi;\n'+setup+';\n'+
            'for(i=n-1;i!==-1;--i) { \n'+
            '    xi = x[i];\n'+
            '    '+body+';\n'+
            '}\n'+
            'return accum;'
            );
};


numeric.same = function same(x,y) {
    var i,n;
    if(!(x instanceof Array) || !(y instanceof Array)) { return false; }
    n = x.length;
    if(n !== y.length) { return false; }
    for(i=0;i<n;i++) {
        if(x[i] === y[i]) { continue; }
        if(typeof x[i] === "object") { if(!same(x[i],y[i])) return false; }
        else { return false; }
    }
    return true;
};

numeric.rep = function rep(s,v,k) {
    if(typeof k === "undefined") { k=0; }
    var n = s[k], ret = Array(n), i;
    if(k === s.length-1) {
        for(i=n-2;i>=0;i-=2) { ret[i+1] = v; ret[i] = v; }
        if(i===-1) { ret[0] = v; }
        return ret;
    }
    for(i=n-1;i>=0;i--) { ret[i] = numeric.rep(s,v,k+1); }
    return ret;
};


numeric.dotMMsmall = function dotMMsmall(x,y) {
    var i,j,k,p,q,r,ret,foo,bar,woo,i0;
    p = x.length; q = y.length; r = y[0].length;
    ret = Array(p);
    for(i=p-1;i>=0;i--) {
        foo = Array(r);
        bar = x[i];
        for(k=r-1;k>=0;k--) {
            woo = bar[q-1]*y[q-1][k];
            for(j=q-2;j>=1;j-=2) {
                i0 = j-1;
                woo += bar[j]*y[j][k] + bar[i0]*y[i0][k];
            }
            if(j===0) { woo += bar[0]*y[0][k]; }
            foo[k] = woo;
        }
        ret[i] = foo;
    }
    return ret;
};
numeric._getCol = function _getCol(A,j,x) {
    var n = A.length, i;
    for(i=n-1;i>0;--i) {
        x[i] = A[i][j];
        --i;
        x[i] = A[i][j];
    }
    if(i===0) x[0] = A[0][j];
};
numeric.dotMMbig = function dotMMbig(x,y){
    var gc = numeric._getCol, p = y.length, v = Array(p);
    var m = x.length, n = y[0].length, A = new Array(m), xj;
    var VV = numeric.dotVV;
    var i,j;
    --p;
    --m;
    for(i=m;i!==-1;--i) A[i] = Array(n);
    --n;
    for(i=n;i!==-1;--i) {
        gc(y,i,v);
        for(j=m;j!==-1;--j) {
            xj = x[j];
            A[j][i] = VV(xj,v);
        }
    }
    return A;
};

numeric.dotMV = function dotMV(x,y) {
    var p = x.length; y.length;var i;
    var ret = Array(p), dotVV = numeric.dotVV;
    for(i=p-1;i>=0;i--) { ret[i] = dotVV(x[i],y); }
    return ret;
};

numeric.dotVM = function dotVM(x,y) {
    var j,k,p,q,ret,woo,i0;
    p = x.length; q = y[0].length;
    ret = Array(q);
    for(k=q-1;k>=0;k--) {
        woo = x[p-1]*y[p-1][k];
        for(j=p-2;j>=1;j-=2) {
            i0 = j-1;
            woo += x[j]*y[j][k] + x[i0]*y[i0][k];
        }
        if(j===0) { woo += x[0]*y[0][k]; }
        ret[k] = woo;
    }
    return ret;
};

numeric.dotVV = function dotVV(x,y) {
    var i,n=x.length,i1,ret = x[n-1]*y[n-1];
    for(i=n-2;i>=1;i-=2) {
        i1 = i-1;
        ret += x[i]*y[i] + x[i1]*y[i1];
    }
    if(i===0) { ret += x[0]*y[0]; }
    return ret;
};

numeric.dot = function dot(x,y) {
    var d = numeric.dim;
    switch(d(x).length*1000+d(y).length) {
    case 2002:
        if(y.length < 10) return numeric.dotMMsmall(x,y);
        else return numeric.dotMMbig(x,y);
    case 2001: return numeric.dotMV(x,y);
    case 1002: return numeric.dotVM(x,y);
    case 1001: return numeric.dotVV(x,y);
    case 1000: return numeric.mulVS(x,y);
    case 1: return numeric.mulSV(x,y);
    case 0: return x*y;
    default: throw new Error('numeric.dot only works on vectors and matrices');
    }
};

numeric.diag = function diag(d) {
    var i,i1,j,n = d.length, A = Array(n), Ai;
    for(i=n-1;i>=0;i--) {
        Ai = Array(n);
        i1 = i+2;
        for(j=n-1;j>=i1;j-=2) {
            Ai[j] = 0;
            Ai[j-1] = 0;
        }
        if(j>i) { Ai[j] = 0; }
        Ai[i] = d[i];
        for(j=i-1;j>=1;j-=2) {
            Ai[j] = 0;
            Ai[j-1] = 0;
        }
        if(j===0) { Ai[0] = 0; }
        A[i] = Ai;
    }
    return A;
};
numeric.getDiag = function(A) {
    var n = Math.min(A.length,A[0].length),i,ret = Array(n);
    for(i=n-1;i>=1;--i) {
        ret[i] = A[i][i];
        --i;
        ret[i] = A[i][i];
    }
    if(i===0) {
        ret[0] = A[0][0];
    }
    return ret;
};

numeric.identity = function identity(n) { return numeric.diag(numeric.rep([n],1)); };
numeric.pointwise = function pointwise(params,body,setup) {
    if(typeof setup === "undefined") { setup = ""; }
    var fun = [];
    var k;
    var avec = /\[i\]$/,p,thevec = '';
    var haveret = false;
    for(k=0;k<params.length;k++) {
        if(avec.test(params[k])) {
            p = params[k].substring(0,params[k].length-3);
            thevec = p;
        } else { p = params[k]; }
        if(p==='ret') haveret = true;
        fun.push(p);
    }
    fun[params.length] = '_s';
    fun[params.length+1] = '_k';
    fun[params.length+2] = (
            'if(typeof _s === "undefined") _s = numeric.dim('+thevec+');\n'+
            'if(typeof _k === "undefined") _k = 0;\n'+
            'var _n = _s[_k];\n'+
            'var i'+(haveret?'':', ret = Array(_n)')+';\n'+
            'if(_k < _s.length-1) {\n'+
            '    for(i=_n-1;i>=0;i--) ret[i] = arguments.callee('+params.join(',')+',_s,_k+1);\n'+
            '    return ret;\n'+
            '}\n'+
            setup+'\n'+
            'for(i=_n-1;i!==-1;--i) {\n'+
            '    '+body+'\n'+
            '}\n'+
            'return ret;'
            );
    return Function.apply(null,fun);
};
numeric.pointwise2 = function pointwise2(params,body,setup) {
    if(typeof setup === "undefined") { setup = ""; }
    var fun = [];
    var k;
    var avec = /\[i\]$/,p,thevec = '';
    var haveret = false;
    for(k=0;k<params.length;k++) {
        if(avec.test(params[k])) {
            p = params[k].substring(0,params[k].length-3);
            thevec = p;
        } else { p = params[k]; }
        if(p==='ret') haveret = true;
        fun.push(p);
    }
    fun[params.length] = (
            'var _n = '+thevec+'.length;\n'+
            'var i'+(haveret?'':', ret = Array(_n)')+';\n'+
            setup+'\n'+
            'for(i=_n-1;i!==-1;--i) {\n'+
            body+'\n'+
            '}\n'+
            'return ret;'
            );
    return Function.apply(null,fun);
};
numeric._biforeach = (function _biforeach(x,y,s,k,f) {
    if(k === s.length-1) { f(x,y); return; }
    var i,n=s[k];
    for(i=n-1;i>=0;i--) { _biforeach(typeof x==="object"?x[i]:x,typeof y==="object"?y[i]:y,s,k+1,f); }
});
numeric._biforeach2 = (function _biforeach2(x,y,s,k,f) {
    if(k === s.length-1) { return f(x,y); }
    var i,n=s[k],ret = Array(n);
    for(i=n-1;i>=0;--i) { ret[i] = _biforeach2(typeof x==="object"?x[i]:x,typeof y==="object"?y[i]:y,s,k+1,f); }
    return ret;
});
numeric._foreach = (function _foreach(x,s,k,f) {
    if(k === s.length-1) { f(x); return; }
    var i,n=s[k];
    for(i=n-1;i>=0;i--) { _foreach(x[i],s,k+1,f); }
});
numeric._foreach2 = (function _foreach2(x,s,k,f) {
    if(k === s.length-1) { return f(x); }
    var i,n=s[k], ret = Array(n);
    for(i=n-1;i>=0;i--) { ret[i] = _foreach2(x[i],s,k+1,f); }
    return ret;
});

/*numeric.anyV = numeric.mapreduce('if(xi) return true;','false');
numeric.allV = numeric.mapreduce('if(!xi) return false;','true');
numeric.any = function(x) { if(typeof x.length === "undefined") return x; return numeric.anyV(x); }
numeric.all = function(x) { if(typeof x.length === "undefined") return x; return numeric.allV(x); }*/

numeric.ops2 = {
        add: '+',
        sub: '-',
        mul: '*',
        div: '/',
        mod: '%',
        and: '&&',
        or:  '||',
        eq:  '===',
        neq: '!==',
        lt:  '<',
        gt:  '>',
        leq: '<=',
        geq: '>=',
        band: '&',
        bor: '|',
        bxor: '^',
        lshift: '<<',
        rshift: '>>',
        rrshift: '>>>'
};
numeric.opseq = {
        addeq: '+=',
        subeq: '-=',
        muleq: '*=',
        diveq: '/=',
        modeq: '%=',
        lshifteq: '<<=',
        rshifteq: '>>=',
        rrshifteq: '>>>=',
        bandeq: '&=',
        boreq: '|=',
        bxoreq: '^='
};
numeric.mathfuns = ['abs','acos','asin','atan','ceil','cos',
                    'exp','floor','log','round','sin','sqrt','tan',
                    'isNaN','isFinite'];
numeric.mathfuns2 = ['atan2','pow','max','min'];
numeric.ops1 = {
        neg: '-',
        not: '!',
        bnot: '~',
        clone: ''
};
numeric.mapreducers = {
        any: ['if(xi) return true;','var accum = false;'],
        all: ['if(!xi) return false;','var accum = true;'],
        sum: ['accum += xi;','var accum = 0;'],
        prod: ['accum *= xi;','var accum = 1;'],
        norm2Squared: ['accum += xi*xi;','var accum = 0;'],
        norminf: ['accum = max(accum,abs(xi));','var accum = 0, max = Math.max, abs = Math.abs;'],
        norm1: ['accum += abs(xi)','var accum = 0, abs = Math.abs;'],
        sup: ['accum = max(accum,xi);','var accum = -Infinity, max = Math.max;'],
        inf: ['accum = min(accum,xi);','var accum = Infinity, min = Math.min;']
};

(function () {
    var i,o;
    for(i=0;i<numeric.mathfuns2.length;++i) {
        o = numeric.mathfuns2[i];
        numeric.ops2[o] = o;
    }
    for(i in numeric.ops2) {
        if(numeric.ops2.hasOwnProperty(i)) {
            o = numeric.ops2[i];
            var code, codeeq, setup = '';
            if(numeric.myIndexOf.call(numeric.mathfuns2,i)!==-1) {
                setup = 'var '+o+' = Math.'+o+';\n';
                code = function(r,x,y) { return r+' = '+o+'('+x+','+y+')'; };
                codeeq = function(x,y) { return x+' = '+o+'('+x+','+y+')'; };
            } else {
                code = function(r,x,y) { return r+' = '+x+' '+o+' '+y; };
                if(numeric.opseq.hasOwnProperty(i+'eq')) {
                    codeeq = function(x,y) { return x+' '+o+'= '+y; };
                } else {
                    codeeq = function(x,y) { return x+' = '+x+' '+o+' '+y; };                    
                }
            }
            numeric[i+'VV'] = numeric.pointwise2(['x[i]','y[i]'],code('ret[i]','x[i]','y[i]'),setup);
            numeric[i+'SV'] = numeric.pointwise2(['x','y[i]'],code('ret[i]','x','y[i]'),setup);
            numeric[i+'VS'] = numeric.pointwise2(['x[i]','y'],code('ret[i]','x[i]','y'),setup);
            numeric[i] = Function(
                    'var n = arguments.length, i, x = arguments[0], y;\n'+
                    'var VV = this.'+i+'VV, VS = this.'+i+'VS, SV = this.'+i+'SV;\n'+
                    'var dim = this.dim;\n'+
                    'for(i=1;i!==n;++i) { \n'+
                    '  y = arguments[i];\n'+
                    '  if(typeof x === "object") {\n'+
                    '      if(typeof y === "object") x = this._biforeach2(x,y,dim(x),0,VV);\n'+
                    '      else x = this._biforeach2(x,y,dim(x),0,VS);\n'+
                    '  } else if(typeof y === "object") x = this._biforeach2(x,y,dim(y),0,SV);\n'+
                    '  else '+codeeq('x','y')+'\n'+
                    '}\nreturn x;\n');
            numeric[o] = numeric[i];
            numeric[i+'eqV'] = numeric.pointwise2(['ret[i]','x[i]'], codeeq('ret[i]','x[i]'),setup);
            numeric[i+'eqS'] = numeric.pointwise2(['ret[i]','x'], codeeq('ret[i]','x'),setup);
            numeric[i+'eq'] = Function(
                    'var n = arguments.length, i, x = arguments[0], y;\n'+
                    'var V = this.'+i+'eqV, S = this.'+i+'eqS\n'+
                    'var s = this.dim(x);\n'+
                    'for(i=1;i!==n;++i) { \n'+
                    '  y = arguments[i];\n'+
                    '  if(typeof y === "object") this._biforeach(x,y,s,0,V);\n'+
                    '  else this._biforeach(x,y,s,0,S);\n'+
                    '}\nreturn x;\n');
        }
    }
    for(i=0;i<numeric.mathfuns2.length;++i) {
        o = numeric.mathfuns2[i];
        delete numeric.ops2[o];
    }
    for(i=0;i<numeric.mathfuns.length;++i) {
        o = numeric.mathfuns[i];
        numeric.ops1[o] = o;
    }
    for(i in numeric.ops1) {
        if(numeric.ops1.hasOwnProperty(i)) {
            setup = '';
            o = numeric.ops1[i];
            if(numeric.myIndexOf.call(numeric.mathfuns,i)!==-1) {
                if(Math.hasOwnProperty(o)) setup = 'var '+o+' = Math.'+o+';\n';
            }
            numeric[i+'eqV'] = numeric.pointwise2(['ret[i]'],'ret[i] = '+o+'(ret[i]);',setup);
            numeric[i+'eq'] = Function('x',
                    'if(typeof x !== "object") return '+o+'x\n'+
                    'var i;\n'+
                    'var V = this.'+i+'eqV;\n'+
                    'var s = this.dim(x);\n'+
                    'this._foreach(x,s,0,V);\n'+
                    'return x;\n');
            numeric[i+'V'] = numeric.pointwise2(['x[i]'],'ret[i] = '+o+'(x[i]);',setup);
            numeric[i] = Function('x',
                    'if(typeof x !== "object") return '+o+'(x)\n'+
                    'var i;\n'+
                    'var V = this.'+i+'V;\n'+
                    'var s = this.dim(x);\n'+
                    'return this._foreach2(x,s,0,V);\n');
        }
    }
    for(i=0;i<numeric.mathfuns.length;++i) {
        o = numeric.mathfuns[i];
        delete numeric.ops1[o];
    }
    for(i in numeric.mapreducers) {
        if(numeric.mapreducers.hasOwnProperty(i)) {
            o = numeric.mapreducers[i];
            numeric[i+'V'] = numeric.mapreduce2(o[0],o[1]);
            numeric[i] = Function('x','s','k',
                    o[1]+
                    'if(typeof x !== "object") {'+
                    '    xi = x;\n'+
                    o[0]+';\n'+
                    '    return accum;\n'+
                    '}'+
                    'if(typeof s === "undefined") s = this.dim(x);\n'+
                    'if(typeof k === "undefined") k = 0;\n'+
                    'if(k === s.length-1) return this.'+i+'V(x);\n'+
                    'var xi;\n'+
                    'var n = x.length, i;\n'+
                    'for(i=n-1;i!==-1;--i) {\n'+
                    '   xi = arguments.callee(x[i]);\n'+
                    o[0]+';\n'+
                    '}\n'+
                    'return accum;\n');
        }
    }
}());

numeric.truncVV = numeric.pointwise(['x[i]','y[i]'],'ret[i] = round(x[i]/y[i])*y[i];','var round = Math.round;');
numeric.truncVS = numeric.pointwise(['x[i]','y'],'ret[i] = round(x[i]/y)*y;','var round = Math.round;');
numeric.truncSV = numeric.pointwise(['x','y[i]'],'ret[i] = round(x/y[i])*y[i];','var round = Math.round;');
numeric.trunc = function trunc(x,y) {
    if(typeof x === "object") {
        if(typeof y === "object") return numeric.truncVV(x,y);
        return numeric.truncVS(x,y);
    }
    if (typeof y === "object") return numeric.truncSV(x,y);
    return Math.round(x/y)*y;
};

numeric.inv = function inv(x) {
    var s = numeric.dim(x), abs = Math.abs, m = s[0], n = s[1];
    var A = numeric.clone(x), Ai, Aj;
    var I = numeric.identity(m), Ii, Ij;
    var i,j,k,x;
    for(j=0;j<n;++j) {
        var i0 = -1;
        var v0 = -1;
        for(i=j;i!==m;++i) { k = abs(A[i][j]); if(k>v0) { i0 = i; v0 = k; } }
        Aj = A[i0]; A[i0] = A[j]; A[j] = Aj;
        Ij = I[i0]; I[i0] = I[j]; I[j] = Ij;
        x = Aj[j];
        for(k=j;k!==n;++k)    Aj[k] /= x; 
        for(k=n-1;k!==-1;--k) Ij[k] /= x;
        for(i=m-1;i!==-1;--i) {
            if(i!==j) {
                Ai = A[i];
                Ii = I[i];
                x = Ai[j];
                for(k=j+1;k!==n;++k)  Ai[k] -= Aj[k]*x;
                for(k=n-1;k>0;--k) { Ii[k] -= Ij[k]*x; --k; Ii[k] -= Ij[k]*x; }
                if(k===0) Ii[0] -= Ij[0]*x;
            }
        }
    }
    return I;
};

numeric.det = function det(x) {
    var s = numeric.dim(x);
    if(s.length !== 2 || s[0] !== s[1]) { throw new Error('numeric: det() only works on square matrices'); }
    var n = s[0], ret = 1,i,j,k,A = numeric.clone(x),Aj,Ai,alpha,temp,k1;
    for(j=0;j<n-1;j++) {
        k=j;
        for(i=j+1;i<n;i++) { if(Math.abs(A[i][j]) > Math.abs(A[k][j])) { k = i; } }
        if(k !== j) {
            temp = A[k]; A[k] = A[j]; A[j] = temp;
            ret *= -1;
        }
        Aj = A[j];
        for(i=j+1;i<n;i++) {
            Ai = A[i];
            alpha = Ai[j]/Aj[j];
            for(k=j+1;k<n-1;k+=2) {
                k1 = k+1;
                Ai[k] -= Aj[k]*alpha;
                Ai[k1] -= Aj[k1]*alpha;
            }
            if(k!==n) { Ai[k] -= Aj[k]*alpha; }
        }
        if(Aj[j] === 0) { return 0; }
        ret *= Aj[j];
    }
    return ret*A[j][j];
};

numeric.transpose = function transpose(x) {
    var i,j,m = x.length,n = x[0].length, ret=Array(n),A0,A1,Bj;
    for(j=0;j<n;j++) ret[j] = Array(m);
    for(i=m-1;i>=1;i-=2) {
        A1 = x[i];
        A0 = x[i-1];
        for(j=n-1;j>=1;--j) {
            Bj = ret[j]; Bj[i] = A1[j]; Bj[i-1] = A0[j];
            --j;
            Bj = ret[j]; Bj[i] = A1[j]; Bj[i-1] = A0[j];
        }
        if(j===0) {
            Bj = ret[0]; Bj[i] = A1[0]; Bj[i-1] = A0[0];
        }
    }
    if(i===0) {
        A0 = x[0];
        for(j=n-1;j>=1;--j) {
            ret[j][0] = A0[j];
            --j;
            ret[j][0] = A0[j];
        }
        if(j===0) { ret[0][0] = A0[0]; }
    }
    return ret;
};
numeric.negtranspose = function negtranspose(x) {
    var i,j,m = x.length,n = x[0].length, ret=Array(n),A0,A1,Bj;
    for(j=0;j<n;j++) ret[j] = Array(m);
    for(i=m-1;i>=1;i-=2) {
        A1 = x[i];
        A0 = x[i-1];
        for(j=n-1;j>=1;--j) {
            Bj = ret[j]; Bj[i] = -A1[j]; Bj[i-1] = -A0[j];
            --j;
            Bj = ret[j]; Bj[i] = -A1[j]; Bj[i-1] = -A0[j];
        }
        if(j===0) {
            Bj = ret[0]; Bj[i] = -A1[0]; Bj[i-1] = -A0[0];
        }
    }
    if(i===0) {
        A0 = x[0];
        for(j=n-1;j>=1;--j) {
            ret[j][0] = -A0[j];
            --j;
            ret[j][0] = -A0[j];
        }
        if(j===0) { ret[0][0] = -A0[0]; }
    }
    return ret;
};

numeric._random = function _random(s,k) {
    var i,n=s[k],ret=Array(n), rnd;
    if(k === s.length-1) {
        rnd = Math.random;
        for(i=n-1;i>=1;i-=2) {
            ret[i] = rnd();
            ret[i-1] = rnd();
        }
        if(i===0) { ret[0] = rnd(); }
        return ret;
    }
    for(i=n-1;i>=0;i--) ret[i] = _random(s,k+1);
    return ret;
};
numeric.random = function random(s) { return numeric._random(s,0); };

numeric.norm2 = function norm2(x) { return Math.sqrt(numeric.norm2Squared(x)); };

numeric.linspace = function linspace(a,b,n) {
    if(typeof n === "undefined") n = Math.max(Math.round(b-a)+1,1);
    if(n<2) { return n===1?[a]:[]; }
    var i,ret = Array(n);
    n--;
    for(i=n;i>=0;i--) { ret[i] = (i*b+(n-i)*a)/n; }
    return ret;
};

numeric.getBlock = function getBlock(x,from,to) {
    var s = numeric.dim(x);
    function foo(x,k) {
        var i,a = from[k], n = to[k]-a, ret = Array(n);
        if(k === s.length-1) {
            for(i=n;i>=0;i--) { ret[i] = x[i+a]; }
            return ret;
        }
        for(i=n;i>=0;i--) { ret[i] = foo(x[i+a],k+1); }
        return ret;
    }
    return foo(x,0);
};

numeric.setBlock = function setBlock(x,from,to,B) {
    var s = numeric.dim(x);
    function foo(x,y,k) {
        var i,a = from[k], n = to[k]-a;
        if(k === s.length-1) { for(i=n;i>=0;i--) { x[i+a] = y[i]; } }
        for(i=n;i>=0;i--) { foo(x[i+a],y[i],k+1); }
    }
    foo(x,B,0);
    return x;
};

numeric.getRange = function getRange(A,I,J) {
    var m = I.length, n = J.length;
    var i,j;
    var B = Array(m), Bi, AI;
    for(i=m-1;i!==-1;--i) {
        B[i] = Array(n);
        Bi = B[i];
        AI = A[I[i]];
        for(j=n-1;j!==-1;--j) Bi[j] = AI[J[j]];
    }
    return B;
};

numeric.blockMatrix = function blockMatrix(X) {
    var s = numeric.dim(X);
    if(s.length<4) return numeric.blockMatrix([X]);
    var m=s[0],n=s[1],M,N,i,j,Xij;
    M = 0; N = 0;
    for(i=0;i<m;++i) M+=X[i][0].length;
    for(j=0;j<n;++j) N+=X[0][j][0].length;
    var Z = Array(M);
    for(i=0;i<M;++i) Z[i] = Array(N);
    var I=0,J,ZI,k,l,Xijk;
    for(i=0;i<m;++i) {
        J=N;
        for(j=n-1;j!==-1;--j) {
            Xij = X[i][j];
            J -= Xij[0].length;
            for(k=Xij.length-1;k!==-1;--k) {
                Xijk = Xij[k];
                ZI = Z[I+k];
                for(l = Xijk.length-1;l!==-1;--l) ZI[J+l] = Xijk[l];
            }
        }
        I += X[i][0].length;
    }
    return Z;
};

numeric.tensor = function tensor(x,y) {
    if(typeof x === "number" || typeof y === "number") return numeric.mul(x,y);
    var s1 = numeric.dim(x), s2 = numeric.dim(y);
    if(s1.length !== 1 || s2.length !== 1) {
        throw new Error('numeric: tensor product is only defined for vectors');
    }
    var m = s1[0], n = s2[0], A = Array(m), Ai, i,j,xi;
    for(i=m-1;i>=0;i--) {
        Ai = Array(n);
        xi = x[i];
        for(j=n-1;j>=3;--j) {
            Ai[j] = xi * y[j];
            --j;
            Ai[j] = xi * y[j];
            --j;
            Ai[j] = xi * y[j];
            --j;
            Ai[j] = xi * y[j];
        }
        while(j>=0) { Ai[j] = xi * y[j]; --j; }
        A[i] = Ai;
    }
    return A;
};

// 3. The Tensor type T
numeric.T = function T(x,y) { this.x = x; this.y = y; };
numeric.t = function t(x,y) { return new numeric.T(x,y); };

numeric.Tbinop = function Tbinop(rr,rc,cr,cc,setup) {
    numeric.indexOf;
    if(typeof setup !== "string") {
        var k;
        setup = '';
        for(k in numeric) {
            if(numeric.hasOwnProperty(k) && (rr.indexOf(k)>=0 || rc.indexOf(k)>=0 || cr.indexOf(k)>=0 || cc.indexOf(k)>=0) && k.length>1) {
                setup += 'var '+k+' = numeric.'+k+';\n';
            }
        }
    }
    return Function(['y'],
            'var x = this;\n'+
            'if(!(y instanceof numeric.T)) { y = new numeric.T(y); }\n'+
            setup+'\n'+
            'if(x.y) {'+
            '  if(y.y) {'+
            '    return new numeric.T('+cc+');\n'+
            '  }\n'+
            '  return new numeric.T('+cr+');\n'+
            '}\n'+
            'if(y.y) {\n'+
            '  return new numeric.T('+rc+');\n'+
            '}\n'+
            'return new numeric.T('+rr+');\n'
    );
};

numeric.T.prototype.add = numeric.Tbinop(
        'add(x.x,y.x)',
        'add(x.x,y.x),y.y',
        'add(x.x,y.x),x.y',
        'add(x.x,y.x),add(x.y,y.y)');
numeric.T.prototype.sub = numeric.Tbinop(
        'sub(x.x,y.x)',
        'sub(x.x,y.x),neg(y.y)',
        'sub(x.x,y.x),x.y',
        'sub(x.x,y.x),sub(x.y,y.y)');
numeric.T.prototype.mul = numeric.Tbinop(
        'mul(x.x,y.x)',
        'mul(x.x,y.x),mul(x.x,y.y)',
        'mul(x.x,y.x),mul(x.y,y.x)',
        'sub(mul(x.x,y.x),mul(x.y,y.y)),add(mul(x.x,y.y),mul(x.y,y.x))');

numeric.T.prototype.reciprocal = function reciprocal() {
    var mul = numeric.mul, div = numeric.div;
    if(this.y) {
        var d = numeric.add(mul(this.x,this.x),mul(this.y,this.y));
        return new numeric.T(div(this.x,d),div(numeric.neg(this.y),d));
    }
    return new T(div(1,this.x));
};
numeric.T.prototype.div = function div(y) {
    if(!(y instanceof numeric.T)) y = new numeric.T(y);
    if(y.y) { return this.mul(y.reciprocal()); }
    var div = numeric.div;
    if(this.y) { return new numeric.T(div(this.x,y.x),div(this.y,y.x)); }
    return new numeric.T(div(this.x,y.x));
};
numeric.T.prototype.dot = numeric.Tbinop(
        'dot(x.x,y.x)',
        'dot(x.x,y.x),dot(x.x,y.y)',
        'dot(x.x,y.x),dot(x.y,y.x)',
        'sub(dot(x.x,y.x),dot(x.y,y.y)),add(dot(x.x,y.y),dot(x.y,y.x))'
        );
numeric.T.prototype.transpose = function transpose() {
    var t = numeric.transpose, x = this.x, y = this.y;
    if(y) { return new numeric.T(t(x),t(y)); }
    return new numeric.T(t(x));
};
numeric.T.prototype.transjugate = function transjugate() {
    var t = numeric.transpose, x = this.x, y = this.y;
    if(y) { return new numeric.T(t(x),numeric.negtranspose(y)); }
    return new numeric.T(t(x));
};
numeric.Tunop = function Tunop(r,c,s) {
    if(typeof s !== "string") { s = ''; }
    return Function(
            'var x = this;\n'+
            s+'\n'+
            'if(x.y) {'+
            '  '+c+';\n'+
            '}\n'+
            r+';\n'
    );
};

numeric.T.prototype.exp = numeric.Tunop(
        'return new numeric.T(ex)',
        'return new numeric.T(mul(cos(x.y),ex),mul(sin(x.y),ex))',
        'var ex = numeric.exp(x.x), cos = numeric.cos, sin = numeric.sin, mul = numeric.mul;');
numeric.T.prototype.conj = numeric.Tunop(
        'return new numeric.T(x.x);',
        'return new numeric.T(x.x,numeric.neg(x.y));');
numeric.T.prototype.neg = numeric.Tunop(
        'return new numeric.T(neg(x.x));',
        'return new numeric.T(neg(x.x),neg(x.y));',
        'var neg = numeric.neg;');
numeric.T.prototype.sin = numeric.Tunop(
        'return new numeric.T(numeric.sin(x.x))',
        'return x.exp().sub(x.neg().exp()).div(new numeric.T(0,2));');
numeric.T.prototype.cos = numeric.Tunop(
        'return new numeric.T(numeric.cos(x.x))',
        'return x.exp().add(x.neg().exp()).div(2);');
numeric.T.prototype.abs = numeric.Tunop(
        'return new numeric.T(numeric.abs(x.x));',
        'return new numeric.T(numeric.sqrt(numeric.add(mul(x.x,x.x),mul(x.y,x.y))));',
        'var mul = numeric.mul;');
numeric.T.prototype.log = numeric.Tunop(
        'return new numeric.T(numeric.log(x.x));',
        'var theta = new numeric.T(numeric.atan2(x.y,x.x)), r = x.abs();\n'+
        'return new numeric.T(numeric.log(r.x),theta.x);');
numeric.T.prototype.norm2 = numeric.Tunop(
        'return numeric.norm2(x.x);',
        'var f = numeric.norm2Squared;\n'+
        'return Math.sqrt(f(x.x)+f(x.y));');
numeric.T.prototype.inv = function inv() {
    var A = this;
    if(typeof A.y === "undefined") { return new numeric.T(numeric.inv(A.x)); }
    var n = A.x.length, i, j, k;
    var Rx = numeric.identity(n),Ry = numeric.rep([n,n],0);
    var Ax = numeric.clone(A.x), Ay = numeric.clone(A.y);
    var Aix, Aiy, Ajx, Ajy, Rix, Riy, Rjx, Rjy;
    var i,j,k,d,d1,ax,ay,bx,by,temp;
    for(i=0;i<n;i++) {
        ax = Ax[i][i]; ay = Ay[i][i];
        d = ax*ax+ay*ay;
        k = i;
        for(j=i+1;j<n;j++) {
            ax = Ax[j][i]; ay = Ay[j][i];
            d1 = ax*ax+ay*ay;
            if(d1 > d) { k=j; d = d1; }
        }
        if(k!==i) {
            temp = Ax[i]; Ax[i] = Ax[k]; Ax[k] = temp;
            temp = Ay[i]; Ay[i] = Ay[k]; Ay[k] = temp;
            temp = Rx[i]; Rx[i] = Rx[k]; Rx[k] = temp;
            temp = Ry[i]; Ry[i] = Ry[k]; Ry[k] = temp;
        }
        Aix = Ax[i]; Aiy = Ay[i];
        Rix = Rx[i]; Riy = Ry[i];
        ax = Aix[i]; ay = Aiy[i];
        for(j=i+1;j<n;j++) {
            bx = Aix[j]; by = Aiy[j];
            Aix[j] = (bx*ax+by*ay)/d;
            Aiy[j] = (by*ax-bx*ay)/d;
        }
        for(j=0;j<n;j++) {
            bx = Rix[j]; by = Riy[j];
            Rix[j] = (bx*ax+by*ay)/d;
            Riy[j] = (by*ax-bx*ay)/d;
        }
        for(j=i+1;j<n;j++) {
            Ajx = Ax[j]; Ajy = Ay[j];
            Rjx = Rx[j]; Rjy = Ry[j];
            ax = Ajx[i]; ay = Ajy[i];
            for(k=i+1;k<n;k++) {
                bx = Aix[k]; by = Aiy[k];
                Ajx[k] -= bx*ax-by*ay;
                Ajy[k] -= by*ax+bx*ay;
            }
            for(k=0;k<n;k++) {
                bx = Rix[k]; by = Riy[k];
                Rjx[k] -= bx*ax-by*ay;
                Rjy[k] -= by*ax+bx*ay;
            }
        }
    }
    for(i=n-1;i>0;i--) {
        Rix = Rx[i]; Riy = Ry[i];
        for(j=i-1;j>=0;j--) {
            Rjx = Rx[j]; Rjy = Ry[j];
            ax = Ax[j][i]; ay = Ay[j][i];
            for(k=n-1;k>=0;k--) {
                bx = Rix[k]; by = Riy[k];
                Rjx[k] -= ax*bx - ay*by;
                Rjy[k] -= ax*by + ay*bx;
            }
        }
    }
    return new numeric.T(Rx,Ry);
};
numeric.T.prototype.get = function get(i) {
    var x = this.x, y = this.y, k = 0, ik, n = i.length;
    if(y) {
        while(k<n) {
            ik = i[k];
            x = x[ik];
            y = y[ik];
            k++;
        }
        return new numeric.T(x,y);
    }
    while(k<n) {
        ik = i[k];
        x = x[ik];
        k++;
    }
    return new numeric.T(x);
};
numeric.T.prototype.set = function set(i,v) {
    var x = this.x, y = this.y, k = 0, ik, n = i.length, vx = v.x, vy = v.y;
    if(n===0) {
        if(vy) { this.y = vy; }
        else if(y) { this.y = undefined; }
        this.x = x;
        return this;
    }
    if(vy) {
        if(y) ;
        else {
            y = numeric.rep(numeric.dim(x),0);
            this.y = y;
        }
        while(k<n-1) {
            ik = i[k];
            x = x[ik];
            y = y[ik];
            k++;
        }
        ik = i[k];
        x[ik] = vx;
        y[ik] = vy;
        return this;
    }
    if(y) {
        while(k<n-1) {
            ik = i[k];
            x = x[ik];
            y = y[ik];
            k++;
        }
        ik = i[k];
        x[ik] = vx;
        if(vx instanceof Array) y[ik] = numeric.rep(numeric.dim(vx),0);
        else y[ik] = 0;
        return this;
    }
    while(k<n-1) {
        ik = i[k];
        x = x[ik];
        k++;
    }
    ik = i[k];
    x[ik] = vx;
    return this;
};
numeric.T.prototype.getRows = function getRows(i0,i1) {
    var n = i1-i0+1, j;
    var rx = Array(n), ry, x = this.x, y = this.y;
    for(j=i0;j<=i1;j++) { rx[j-i0] = x[j]; }
    if(y) {
        ry = Array(n);
        for(j=i0;j<=i1;j++) { ry[j-i0] = y[j]; }
        return new numeric.T(rx,ry);
    }
    return new numeric.T(rx);
};
numeric.T.prototype.setRows = function setRows(i0,i1,A) {
    var j;
    var rx = this.x, ry = this.y, x = A.x, y = A.y;
    for(j=i0;j<=i1;j++) { rx[j] = x[j-i0]; }
    if(y) {
        if(!ry) { ry = numeric.rep(numeric.dim(rx),0); this.y = ry; }
        for(j=i0;j<=i1;j++) { ry[j] = y[j-i0]; }
    } else if(ry) {
        for(j=i0;j<=i1;j++) { ry[j] = numeric.rep([x[j-i0].length],0); }
    }
    return this;
};
numeric.T.prototype.getRow = function getRow(k) {
    var x = this.x, y = this.y;
    if(y) { return new numeric.T(x[k],y[k]); }
    return new numeric.T(x[k]);
};
numeric.T.prototype.setRow = function setRow(i,v) {
    var rx = this.x, ry = this.y, x = v.x, y = v.y;
    rx[i] = x;
    if(y) {
        if(!ry) { ry = numeric.rep(numeric.dim(rx),0); this.y = ry; }
        ry[i] = y;
    } else if(ry) {
        ry = numeric.rep([x.length],0);
    }
    return this;
};

numeric.T.prototype.getBlock = function getBlock(from,to) {
    var x = this.x, y = this.y, b = numeric.getBlock;
    if(y) { return new numeric.T(b(x,from,to),b(y,from,to)); }
    return new numeric.T(b(x,from,to));
};
numeric.T.prototype.setBlock = function setBlock(from,to,A) {
    if(!(A instanceof numeric.T)) A = new numeric.T(A);
    var x = this.x, y = this.y, b = numeric.setBlock, Ax = A.x, Ay = A.y;
    if(Ay) {
        if(!y) { this.y = numeric.rep(numeric.dim(this),0); y = this.y; }
        b(x,from,to,Ax);
        b(y,from,to,Ay);
        return this;
    }
    b(x,from,to,Ax);
    if(y) b(y,from,to,numeric.rep(numeric.dim(Ax),0));
};
numeric.T.rep = function rep(s,v) {
    var T = numeric.T;
    if(!(v instanceof T)) v = new T(v);
    var x = v.x, y = v.y, r = numeric.rep;
    if(y) return new T(r(s,x),r(s,y));
    return new T(r(s,x));
};
numeric.T.diag = function diag(d) {
    if(!(d instanceof numeric.T)) d = new numeric.T(d);
    var x = d.x, y = d.y, diag = numeric.diag;
    if(y) return new numeric.T(diag(x),diag(y));
    return new numeric.T(diag(x));
};
numeric.T.eig = function eig() {
    if(this.y) { throw new Error('eig: not implemented for complex matrices.'); }
    return numeric.eig(this.x);
};
numeric.T.identity = function identity(n) { return new numeric.T(numeric.identity(n)); };
numeric.T.prototype.getDiag = function getDiag() {
    var n = numeric;
    var x = this.x, y = this.y;
    if(y) { return new n.T(n.getDiag(x),n.getDiag(y)); }
    return new n.T(n.getDiag(x));
};

// 4. Eigenvalues of real matrices

numeric.house = function house(x) {
    var v = numeric.clone(x);
    var s = x[0] >= 0 ? 1 : -1;
    var alpha = s*numeric.norm2(x);
    v[0] += alpha;
    var foo = numeric.norm2(v);
    if(foo === 0) { /* this should not happen */ throw new Error('eig: internal error'); }
    return numeric.div(v,foo);
};

numeric.toUpperHessenberg = function toUpperHessenberg(me) {
    var s = numeric.dim(me);
    if(s.length !== 2 || s[0] !== s[1]) { throw new Error('numeric: toUpperHessenberg() only works on square matrices'); }
    var m = s[0], i,j,k,x,v,A = numeric.clone(me),B,C,Ai,Ci,Q = numeric.identity(m),Qi;
    for(j=0;j<m-2;j++) {
        x = Array(m-j-1);
        for(i=j+1;i<m;i++) { x[i-j-1] = A[i][j]; }
        if(numeric.norm2(x)>0) {
            v = numeric.house(x);
            B = numeric.getBlock(A,[j+1,j],[m-1,m-1]);
            C = numeric.tensor(v,numeric.dot(v,B));
            for(i=j+1;i<m;i++) { Ai = A[i]; Ci = C[i-j-1]; for(k=j;k<m;k++) Ai[k] -= 2*Ci[k-j]; }
            B = numeric.getBlock(A,[0,j+1],[m-1,m-1]);
            C = numeric.tensor(numeric.dot(B,v),v);
            for(i=0;i<m;i++) { Ai = A[i]; Ci = C[i]; for(k=j+1;k<m;k++) Ai[k] -= 2*Ci[k-j-1]; }
            B = Array(m-j-1);
            for(i=j+1;i<m;i++) B[i-j-1] = Q[i];
            C = numeric.tensor(v,numeric.dot(v,B));
            for(i=j+1;i<m;i++) { Qi = Q[i]; Ci = C[i-j-1]; for(k=0;k<m;k++) Qi[k] -= 2*Ci[k]; }
        }
    }
    return {H:A, Q:Q};
};

numeric.epsilon = 2.220446049250313e-16;

numeric.QRFrancis = function(H,maxiter) {
    if(typeof maxiter === "undefined") { maxiter = 10000; }
    H = numeric.clone(H);
    numeric.clone(H);
    var s = numeric.dim(H),m=s[0],x,v,a,b,c,d,det,tr, Hloc, Q = numeric.identity(m), Qi, Hi, B, C, Ci,i,j,k,iter;
    if(m<3) { return {Q:Q, B:[ [0,m-1] ]}; }
    var epsilon = numeric.epsilon;
    for(iter=0;iter<maxiter;iter++) {
        for(j=0;j<m-1;j++) {
            if(Math.abs(H[j+1][j]) < epsilon*(Math.abs(H[j][j])+Math.abs(H[j+1][j+1]))) {
                var QH1 = numeric.QRFrancis(numeric.getBlock(H,[0,0],[j,j]),maxiter);
                var QH2 = numeric.QRFrancis(numeric.getBlock(H,[j+1,j+1],[m-1,m-1]),maxiter);
                B = Array(j+1);
                for(i=0;i<=j;i++) { B[i] = Q[i]; }
                C = numeric.dot(QH1.Q,B);
                for(i=0;i<=j;i++) { Q[i] = C[i]; }
                B = Array(m-j-1);
                for(i=j+1;i<m;i++) { B[i-j-1] = Q[i]; }
                C = numeric.dot(QH2.Q,B);
                for(i=j+1;i<m;i++) { Q[i] = C[i-j-1]; }
                return {Q:Q,B:QH1.B.concat(numeric.add(QH2.B,j+1))};
            }
        }
        a = H[m-2][m-2]; b = H[m-2][m-1];
        c = H[m-1][m-2]; d = H[m-1][m-1];
        tr = a+d;
        det = (a*d-b*c);
        Hloc = numeric.getBlock(H, [0,0], [2,2]);
        if(tr*tr>=4*det) {
            var s1,s2;
            s1 = 0.5*(tr+Math.sqrt(tr*tr-4*det));
            s2 = 0.5*(tr-Math.sqrt(tr*tr-4*det));
            Hloc = numeric.add(numeric.sub(numeric.dot(Hloc,Hloc),
                                           numeric.mul(Hloc,s1+s2)),
                               numeric.diag(numeric.rep([3],s1*s2)));
        } else {
            Hloc = numeric.add(numeric.sub(numeric.dot(Hloc,Hloc),
                                           numeric.mul(Hloc,tr)),
                               numeric.diag(numeric.rep([3],det)));
        }
        x = [Hloc[0][0],Hloc[1][0],Hloc[2][0]];
        v = numeric.house(x);
        B = [H[0],H[1],H[2]];
        C = numeric.tensor(v,numeric.dot(v,B));
        for(i=0;i<3;i++) { Hi = H[i]; Ci = C[i]; for(k=0;k<m;k++) Hi[k] -= 2*Ci[k]; }
        B = numeric.getBlock(H, [0,0],[m-1,2]);
        C = numeric.tensor(numeric.dot(B,v),v);
        for(i=0;i<m;i++) { Hi = H[i]; Ci = C[i]; for(k=0;k<3;k++) Hi[k] -= 2*Ci[k]; }
        B = [Q[0],Q[1],Q[2]];
        C = numeric.tensor(v,numeric.dot(v,B));
        for(i=0;i<3;i++) { Qi = Q[i]; Ci = C[i]; for(k=0;k<m;k++) Qi[k] -= 2*Ci[k]; }
        var J;
        for(j=0;j<m-2;j++) {
            for(k=j;k<=j+1;k++) {
                if(Math.abs(H[k+1][k]) < epsilon*(Math.abs(H[k][k])+Math.abs(H[k+1][k+1]))) {
                    var QH1 = numeric.QRFrancis(numeric.getBlock(H,[0,0],[k,k]),maxiter);
                    var QH2 = numeric.QRFrancis(numeric.getBlock(H,[k+1,k+1],[m-1,m-1]),maxiter);
                    B = Array(k+1);
                    for(i=0;i<=k;i++) { B[i] = Q[i]; }
                    C = numeric.dot(QH1.Q,B);
                    for(i=0;i<=k;i++) { Q[i] = C[i]; }
                    B = Array(m-k-1);
                    for(i=k+1;i<m;i++) { B[i-k-1] = Q[i]; }
                    C = numeric.dot(QH2.Q,B);
                    for(i=k+1;i<m;i++) { Q[i] = C[i-k-1]; }
                    return {Q:Q,B:QH1.B.concat(numeric.add(QH2.B,k+1))};
                }
            }
            J = Math.min(m-1,j+3);
            x = Array(J-j);
            for(i=j+1;i<=J;i++) { x[i-j-1] = H[i][j]; }
            v = numeric.house(x);
            B = numeric.getBlock(H, [j+1,j],[J,m-1]);
            C = numeric.tensor(v,numeric.dot(v,B));
            for(i=j+1;i<=J;i++) { Hi = H[i]; Ci = C[i-j-1]; for(k=j;k<m;k++) Hi[k] -= 2*Ci[k-j]; }
            B = numeric.getBlock(H, [0,j+1],[m-1,J]);
            C = numeric.tensor(numeric.dot(B,v),v);
            for(i=0;i<m;i++) { Hi = H[i]; Ci = C[i]; for(k=j+1;k<=J;k++) Hi[k] -= 2*Ci[k-j-1]; }
            B = Array(J-j);
            for(i=j+1;i<=J;i++) B[i-j-1] = Q[i];
            C = numeric.tensor(v,numeric.dot(v,B));
            for(i=j+1;i<=J;i++) { Qi = Q[i]; Ci = C[i-j-1]; for(k=0;k<m;k++) Qi[k] -= 2*Ci[k]; }
        }
    }
    throw new Error('numeric: eigenvalue iteration does not converge -- increase maxiter?');
};

numeric.eig = function eig(A,maxiter) {
    var QH = numeric.toUpperHessenberg(A);
    var QB = numeric.QRFrancis(QH.H,maxiter);
    var T = numeric.T;
    var n = A.length,i,k,B = QB.B,H = numeric.dot(QB.Q,numeric.dot(QH.H,numeric.transpose(QB.Q)));
    var Q = new T(numeric.dot(QB.Q,QH.Q)),Q0;
    var m = B.length,j;
    var a,b,c,d,p1,p2,disc,x,y,p,q,n1,n2;
    var sqrt = Math.sqrt;
    for(k=0;k<m;k++) {
        i = B[k][0];
        if(i === B[k][1]) ; else {
            j = i+1;
            a = H[i][i];
            b = H[i][j];
            c = H[j][i];
            d = H[j][j];
            if(b === 0 && c === 0) continue;
            p1 = -a-d;
            p2 = a*d-b*c;
            disc = p1*p1-4*p2;
            if(disc>=0) {
                if(p1<0) x = -0.5*(p1-sqrt(disc));
                else     x = -0.5*(p1+sqrt(disc));
                n1 = (a-x)*(a-x)+b*b;
                n2 = c*c+(d-x)*(d-x);
                if(n1>n2) {
                    n1 = sqrt(n1);
                    p = (a-x)/n1;
                    q = b/n1;
                } else {
                    n2 = sqrt(n2);
                    p = c/n2;
                    q = (d-x)/n2;
                }
                Q0 = new T([[q,-p],[p,q]]);
                Q.setRows(i,j,Q0.dot(Q.getRows(i,j)));
            } else {
                x = -0.5*p1;
                y = 0.5*sqrt(-disc);
                n1 = (a-x)*(a-x)+b*b;
                n2 = c*c+(d-x)*(d-x);
                if(n1>n2) {
                    n1 = sqrt(n1+y*y);
                    p = (a-x)/n1;
                    q = b/n1;
                    x = 0;
                    y /= n1;
                } else {
                    n2 = sqrt(n2+y*y);
                    p = c/n2;
                    q = (d-x)/n2;
                    x = y/n2;
                    y = 0;
                }
                Q0 = new T([[q,-p],[p,q]],[[x,y],[y,-x]]);
                Q.setRows(i,j,Q0.dot(Q.getRows(i,j)));
            }
        }
    }
    var R = Q.dot(A).dot(Q.transjugate()), n = A.length, E = numeric.T.identity(n);
    for(j=0;j<n;j++) {
        if(j>0) {
            for(k=j-1;k>=0;k--) {
                var Rk = R.get([k,k]), Rj = R.get([j,j]);
                if(numeric.neq(Rk.x,Rj.x) || numeric.neq(Rk.y,Rj.y)) {
                    x = R.getRow(k).getBlock([k],[j-1]);
                    y = E.getRow(j).getBlock([k],[j-1]);
                    E.set([j,k],(R.get([k,j]).neg().sub(x.dot(y))).div(Rk.sub(Rj)));
                } else {
                    E.setRow(j,E.getRow(k));
                    continue;
                }
            }
        }
    }
    for(j=0;j<n;j++) {
        x = E.getRow(j);
        E.setRow(j,x.div(x.norm2()));
    }
    E = E.transpose();
    E = Q.transjugate().dot(E);
    return { lambda:R.getDiag(), E:E };
};

// 5. Compressed Column Storage matrices
numeric.ccsSparse = function ccsSparse(A) {
    var m = A.length,n,foo, i,j, counts = [];
    for(i=m-1;i!==-1;--i) {
        foo = A[i];
        for(j in foo) {
            j = parseInt(j);
            while(j>=counts.length) counts[counts.length] = 0;
            if(foo[j]!==0) counts[j]++;
        }
    }
    var n = counts.length;
    var Ai = Array(n+1);
    Ai[0] = 0;
    for(i=0;i<n;++i) Ai[i+1] = Ai[i] + counts[i];
    var Aj = Array(Ai[n]), Av = Array(Ai[n]);
    for(i=m-1;i!==-1;--i) {
        foo = A[i];
        for(j in foo) {
            if(foo[j]!==0) {
                counts[j]--;
                Aj[Ai[j]+counts[j]] = i;
                Av[Ai[j]+counts[j]] = foo[j];
            }
        }
    }
    return [Ai,Aj,Av];
};
numeric.ccsFull = function ccsFull(A) {
    var Ai = A[0], Aj = A[1], Av = A[2], s = numeric.ccsDim(A), m = s[0], n = s[1], i,j,j0,j1;
    var B = numeric.rep([m,n],0);
    for(i=0;i<n;i++) {
        j0 = Ai[i];
        j1 = Ai[i+1];
        for(j=j0;j<j1;++j) { B[Aj[j]][i] = Av[j]; }
    }
    return B;
};
numeric.ccsTSolve = function ccsTSolve(A,b,x,bj,xj) {
    var Ai = A[0], Aj = A[1], Av = A[2],m = Ai.length-1, max = Math.max,n=0;
    if(typeof bj === "undefined") x = numeric.rep([m],0);
    if(typeof bj === "undefined") bj = numeric.linspace(0,x.length-1);
    if(typeof xj === "undefined") xj = [];
    function dfs(j) {
        var k;
        if(x[j] !== 0) return;
        x[j] = 1;
        for(k=Ai[j];k<Ai[j+1];++k) dfs(Aj[k]);
        xj[n] = j;
        ++n;
    }
    var i,j,j0,j1,k,l,a;
    for(i=bj.length-1;i!==-1;--i) { dfs(bj[i]); }
    xj.length = n;
    for(i=xj.length-1;i!==-1;--i) { x[xj[i]] = 0; }
    for(i=bj.length-1;i!==-1;--i) { j = bj[i]; x[j] = b[j]; }
    for(i=xj.length-1;i!==-1;--i) {
        j = xj[i];
        j0 = Ai[j];
        j1 = max(Ai[j+1],j0);
        for(k=j0;k!==j1;++k) { if(Aj[k] === j) { x[j] /= Av[k]; break; } }
        a = x[j];
        for(k=j0;k!==j1;++k) {
            l = Aj[k];
            if(l !== j) x[l] -= a*Av[k];
        }
    }
    return x;
};
numeric.ccsDFS = function ccsDFS(n) {
    this.k = Array(n);
    this.k1 = Array(n);
    this.j = Array(n);
};
numeric.ccsDFS.prototype.dfs = function dfs(J,Ai,Aj,x,xj,Pinv) {
    var m = 0,foo,n=xj.length;
    var k = this.k, k1 = this.k1, j = this.j,km,k11;
    if(x[J]!==0) return;
    x[J] = 1;
    j[0] = J;
    k[0] = km = Ai[J];
    k1[0] = k11 = Ai[J+1];
    while(1) {
        if(km >= k11) {
            xj[n] = j[m];
            if(m===0) return;
            ++n;
            --m;
            km = k[m];
            k11 = k1[m];
        } else {
            foo = Pinv[Aj[km]];
            if(x[foo] === 0) {
                x[foo] = 1;
                k[m] = km;
                ++m;
                j[m] = foo;
                km = Ai[foo];
                k1[m] = k11 = Ai[foo+1];
            } else ++km;
        }
    }
};
numeric.ccsLPSolve = function ccsLPSolve(A,B,x,xj,I,Pinv,dfs) {
    var Ai = A[0], Aj = A[1], Av = A[2];Ai.length-1;
    var Bi = B[0], Bj = B[1], Bv = B[2];
    
    var i,i0,i1,j,j0,j1,k,l,a;
    i0 = Bi[I];
    i1 = Bi[I+1];
    xj.length = 0;
    for(i=i0;i<i1;++i) { dfs.dfs(Pinv[Bj[i]],Ai,Aj,x,xj,Pinv); }
    for(i=xj.length-1;i!==-1;--i) { x[xj[i]] = 0; }
    for(i=i0;i!==i1;++i) { j = Pinv[Bj[i]]; x[j] = Bv[i]; }
    for(i=xj.length-1;i!==-1;--i) {
        j = xj[i];
        j0 = Ai[j];
        j1 = Ai[j+1];
        for(k=j0;k<j1;++k) { if(Pinv[Aj[k]] === j) { x[j] /= Av[k]; break; } }
        a = x[j];
        for(k=j0;k<j1;++k) {
            l = Pinv[Aj[k]];
            if(l !== j) x[l] -= a*Av[k];
        }
    }
    return x;
};
numeric.ccsLUP1 = function ccsLUP1(A,threshold) {
    var m = A[0].length-1;
    var L = [numeric.rep([m+1],0),[],[]], U = [numeric.rep([m+1], 0),[],[]];
    var Li = L[0], Lj = L[1], Lv = L[2], Ui = U[0], Uj = U[1], Uv = U[2];
    var x = numeric.rep([m],0), xj = numeric.rep([m],0);
    var i,j,k,a,e,c,d;
    var sol = numeric.ccsLPSolve, abs = Math.abs;
    var P = numeric.linspace(0,m-1),Pinv = numeric.linspace(0,m-1);
    var dfs = new numeric.ccsDFS(m);
    if(typeof threshold === "undefined") { threshold = 1; }
    for(i=0;i<m;++i) {
        sol(L,A,x,xj,i,Pinv,dfs);
        a = -1;
        e = -1;
        for(j=xj.length-1;j!==-1;--j) {
            k = xj[j];
            if(k <= i) continue;
            c = abs(x[k]);
            if(c > a) { e = k; a = c; }
        }
        if(abs(x[i])<threshold*a) {
            j = P[i];
            a = P[e];
            P[i] = a; Pinv[a] = i;
            P[e] = j; Pinv[j] = e;
            a = x[i]; x[i] = x[e]; x[e] = a;
        }
        a = Li[i];
        e = Ui[i];
        d = x[i];
        Lj[a] = P[i];
        Lv[a] = 1;
        ++a;
        for(j=xj.length-1;j!==-1;--j) {
            k = xj[j];
            c = x[k];
            xj[j] = 0;
            x[k] = 0;
            if(k<=i) { Uj[e] = k; Uv[e] = c;   ++e; }
            else     { Lj[a] = P[k]; Lv[a] = c/d; ++a; }
        }
        Li[i+1] = a;
        Ui[i+1] = e;
    }
    for(j=Lj.length-1;j!==-1;--j) { Lj[j] = Pinv[Lj[j]]; }
    return {L:L, U:U, P:P, Pinv:Pinv};
};
numeric.ccsDFS0 = function ccsDFS0(n) {
    this.k = Array(n);
    this.k1 = Array(n);
    this.j = Array(n);
};
numeric.ccsDFS0.prototype.dfs = function dfs(J,Ai,Aj,x,xj,Pinv,P) {
    var m = 0,foo,n=xj.length;
    var k = this.k, k1 = this.k1, j = this.j,km,k11;
    if(x[J]!==0) return;
    x[J] = 1;
    j[0] = J;
    k[0] = km = Ai[Pinv[J]];
    k1[0] = k11 = Ai[Pinv[J]+1];
    while(1) {
        if(isNaN(km)) throw new Error("Ow!");
        if(km >= k11) {
            xj[n] = Pinv[j[m]];
            if(m===0) return;
            ++n;
            --m;
            km = k[m];
            k11 = k1[m];
        } else {
            foo = Aj[km];
            if(x[foo] === 0) {
                x[foo] = 1;
                k[m] = km;
                ++m;
                j[m] = foo;
                foo = Pinv[foo];
                km = Ai[foo];
                k1[m] = k11 = Ai[foo+1];
            } else ++km;
        }
    }
};
numeric.ccsLPSolve0 = function ccsLPSolve0(A,B,y,xj,I,Pinv,P,dfs) {
    var Ai = A[0], Aj = A[1], Av = A[2];Ai.length-1;
    var Bi = B[0], Bj = B[1], Bv = B[2];
    
    var i,i0,i1,j,j0,j1,k,l,a;
    i0 = Bi[I];
    i1 = Bi[I+1];
    xj.length = 0;
    for(i=i0;i<i1;++i) { dfs.dfs(Bj[i],Ai,Aj,y,xj,Pinv,P); }
    for(i=xj.length-1;i!==-1;--i) { j = xj[i]; y[P[j]] = 0; }
    for(i=i0;i!==i1;++i) { j = Bj[i]; y[j] = Bv[i]; }
    for(i=xj.length-1;i!==-1;--i) {
        j = xj[i];
        l = P[j];
        j0 = Ai[j];
        j1 = Ai[j+1];
        for(k=j0;k<j1;++k) { if(Aj[k] === l) { y[l] /= Av[k]; break; } }
        a = y[l];
        for(k=j0;k<j1;++k) y[Aj[k]] -= a*Av[k];
        y[l] = a;
    }
};
numeric.ccsLUP0 = function ccsLUP0(A,threshold) {
    var m = A[0].length-1;
    var L = [numeric.rep([m+1],0),[],[]], U = [numeric.rep([m+1], 0),[],[]];
    var Li = L[0], Lj = L[1], Lv = L[2], Ui = U[0], Uj = U[1], Uv = U[2];
    var y = numeric.rep([m],0), xj = numeric.rep([m],0);
    var i,j,k,a,e,c,d;
    var sol = numeric.ccsLPSolve0, abs = Math.abs;
    var P = numeric.linspace(0,m-1),Pinv = numeric.linspace(0,m-1);
    var dfs = new numeric.ccsDFS0(m);
    if(typeof threshold === "undefined") { threshold = 1; }
    for(i=0;i<m;++i) {
        sol(L,A,y,xj,i,Pinv,P,dfs);
        a = -1;
        e = -1;
        for(j=xj.length-1;j!==-1;--j) {
            k = xj[j];
            if(k <= i) continue;
            c = abs(y[P[k]]);
            if(c > a) { e = k; a = c; }
        }
        if(abs(y[P[i]])<threshold*a) {
            j = P[i];
            a = P[e];
            P[i] = a; Pinv[a] = i;
            P[e] = j; Pinv[j] = e;
        }
        a = Li[i];
        e = Ui[i];
        d = y[P[i]];
        Lj[a] = P[i];
        Lv[a] = 1;
        ++a;
        for(j=xj.length-1;j!==-1;--j) {
            k = xj[j];
            c = y[P[k]];
            xj[j] = 0;
            y[P[k]] = 0;
            if(k<=i) { Uj[e] = k; Uv[e] = c;   ++e; }
            else     { Lj[a] = P[k]; Lv[a] = c/d; ++a; }
        }
        Li[i+1] = a;
        Ui[i+1] = e;
    }
    for(j=Lj.length-1;j!==-1;--j) { Lj[j] = Pinv[Lj[j]]; }
    return {L:L, U:U, P:P, Pinv:Pinv};
};
numeric.ccsLUP = numeric.ccsLUP0;

numeric.ccsDim = function ccsDim(A) { return [numeric.sup(A[1])+1,A[0].length-1]; };
numeric.ccsGetBlock = function ccsGetBlock(A,i,j) {
    var s = numeric.ccsDim(A),m=s[0],n=s[1];
    if(typeof i === "undefined") { i = numeric.linspace(0,m-1); }
    else if(typeof i === "number") { i = [i]; }
    if(typeof j === "undefined") { j = numeric.linspace(0,n-1); }
    else if(typeof j === "number") { j = [j]; }
    var p,P = i.length,q,Q = j.length,r,jq,ip;
    var Bi = numeric.rep([n],0), Bj=[], Bv=[], B = [Bi,Bj,Bv];
    var Ai = A[0], Aj = A[1], Av = A[2];
    var x = numeric.rep([m],0),count=0,flags = numeric.rep([m],0);
    for(q=0;q<Q;++q) {
        jq = j[q];
        var q0 = Ai[jq];
        var q1 = Ai[jq+1];
        for(p=q0;p<q1;++p) {
            r = Aj[p];
            flags[r] = 1;
            x[r] = Av[p];
        }
        for(p=0;p<P;++p) {
            ip = i[p];
            if(flags[ip]) {
                Bj[count] = p;
                Bv[count] = x[i[p]];
                ++count;
            }
        }
        for(p=q0;p<q1;++p) {
            r = Aj[p];
            flags[r] = 0;
        }
        Bi[q+1] = count;
    }
    return B;
};

numeric.ccsDot = function ccsDot(A,B) {
    var Ai = A[0], Aj = A[1], Av = A[2];
    var Bi = B[0], Bj = B[1], Bv = B[2];
    var sA = numeric.ccsDim(A), sB = numeric.ccsDim(B);
    var m = sA[0]; sA[1]; var o = sB[1];
    var x = numeric.rep([m],0), flags = numeric.rep([m],0), xj = Array(m);
    var Ci = numeric.rep([o],0), Cj = [], Cv = [], C = [Ci,Cj,Cv];
    var i,j,k,j0,j1,i0,i1,l,p,a,b;
    for(k=0;k!==o;++k) {
        j0 = Bi[k];
        j1 = Bi[k+1];
        p = 0;
        for(j=j0;j<j1;++j) {
            a = Bj[j];
            b = Bv[j];
            i0 = Ai[a];
            i1 = Ai[a+1];
            for(i=i0;i<i1;++i) {
                l = Aj[i];
                if(flags[l]===0) {
                    xj[p] = l;
                    flags[l] = 1;
                    p = p+1;
                }
                x[l] = x[l] + Av[i]*b;
            }
        }
        j0 = Ci[k];
        j1 = j0+p;
        Ci[k+1] = j1;
        for(j=p-1;j!==-1;--j) {
            b = j0+j;
            i = xj[j];
            Cj[b] = i;
            Cv[b] = x[i];
            flags[i] = 0;
            x[i] = 0;
        }
        Ci[k+1] = Ci[k]+p;
    }
    return C;
};

numeric.ccsLUPSolve = function ccsLUPSolve(LUP,B) {
    var L = LUP.L, U = LUP.U; LUP.P;
    var Bi = B[0];
    var flag = false;
    if(typeof Bi !== "object") { B = [[0,B.length],numeric.linspace(0,B.length-1),B]; Bi = B[0]; flag = true; }
    var Bj = B[1], Bv = B[2];
    var n = L[0].length-1, m = Bi.length-1;
    var x = numeric.rep([n],0), xj = Array(n);
    var b = numeric.rep([n],0), bj = Array(n);
    var Xi = numeric.rep([m+1],0), Xj = [], Xv = [];
    var sol = numeric.ccsTSolve;
    var i,j,j0,j1,k,J,N=0;
    for(i=0;i<m;++i) {
        k = 0;
        j0 = Bi[i];
        j1 = Bi[i+1];
        for(j=j0;j<j1;++j) { 
            J = LUP.Pinv[Bj[j]];
            bj[k] = J;
            b[J] = Bv[j];
            ++k;
        }
        bj.length = k;
        sol(L,b,x,bj,xj);
        for(j=bj.length-1;j!==-1;--j) b[bj[j]] = 0;
        sol(U,x,b,xj,bj);
        if(flag) return b;
        for(j=xj.length-1;j!==-1;--j) x[xj[j]] = 0;
        for(j=bj.length-1;j!==-1;--j) {
            J = bj[j];
            Xj[N] = J;
            Xv[N] = b[J];
            b[J] = 0;
            ++N;
        }
        Xi[i+1] = N;
    }
    return [Xi,Xj,Xv];
};

numeric.ccsbinop = function ccsbinop(body,setup) {
    if(typeof setup === "undefined") setup='';
    return Function('X','Y',
            'var Xi = X[0], Xj = X[1], Xv = X[2];\n'+
            'var Yi = Y[0], Yj = Y[1], Yv = Y[2];\n'+
            'var n = Xi.length-1,m = Math.max(numeric.sup(Xj),numeric.sup(Yj))+1;\n'+
            'var Zi = numeric.rep([n+1],0), Zj = [], Zv = [];\n'+
            'var x = numeric.rep([m],0),y = numeric.rep([m],0);\n'+
            'var xk,yk,zk;\n'+
            'var i,j,j0,j1,k,p=0;\n'+
            setup+
            'for(i=0;i<n;++i) {\n'+
            '  j0 = Xi[i]; j1 = Xi[i+1];\n'+
            '  for(j=j0;j!==j1;++j) {\n'+
            '    k = Xj[j];\n'+
            '    x[k] = 1;\n'+
            '    Zj[p] = k;\n'+
            '    ++p;\n'+
            '  }\n'+
            '  j0 = Yi[i]; j1 = Yi[i+1];\n'+
            '  for(j=j0;j!==j1;++j) {\n'+
            '    k = Yj[j];\n'+
            '    y[k] = Yv[j];\n'+
            '    if(x[k] === 0) {\n'+
            '      Zj[p] = k;\n'+
            '      ++p;\n'+
            '    }\n'+
            '  }\n'+
            '  Zi[i+1] = p;\n'+
            '  j0 = Xi[i]; j1 = Xi[i+1];\n'+
            '  for(j=j0;j!==j1;++j) x[Xj[j]] = Xv[j];\n'+
            '  j0 = Zi[i]; j1 = Zi[i+1];\n'+
            '  for(j=j0;j!==j1;++j) {\n'+
            '    k = Zj[j];\n'+
            '    xk = x[k];\n'+
            '    yk = y[k];\n'+
            body+'\n'+
            '    Zv[j] = zk;\n'+
            '  }\n'+
            '  j0 = Xi[i]; j1 = Xi[i+1];\n'+
            '  for(j=j0;j!==j1;++j) x[Xj[j]] = 0;\n'+
            '  j0 = Yi[i]; j1 = Yi[i+1];\n'+
            '  for(j=j0;j!==j1;++j) y[Yj[j]] = 0;\n'+
            '}\n'+
            'return [Zi,Zj,Zv];'
            );
};

(function() {
    var k,A,B,C;
    for(k in numeric.ops2) {
        if(isFinite(eval('1'+numeric.ops2[k]+'0'))) A = '[Y[0],Y[1],numeric.'+k+'(X,Y[2])]';
        else A = 'NaN';
        if(isFinite(eval('0'+numeric.ops2[k]+'1'))) B = '[X[0],X[1],numeric.'+k+'(X[2],Y)]';
        else B = 'NaN';
        if(isFinite(eval('1'+numeric.ops2[k]+'0')) && isFinite(eval('0'+numeric.ops2[k]+'1'))) C = 'numeric.ccs'+k+'MM(X,Y)';
        else C = 'NaN';
        numeric['ccs'+k+'MM'] = numeric.ccsbinop('zk = xk '+numeric.ops2[k]+'yk;');
        numeric['ccs'+k] = Function('X','Y',
                'if(typeof X === "number") return '+A+';\n'+
                'if(typeof Y === "number") return '+B+';\n'+
                'return '+C+';\n'
                );
    }
}());

numeric.ccsScatter = function ccsScatter(A) {
    var Ai = A[0], Aj = A[1], Av = A[2];
    var n = numeric.sup(Aj)+1,m=Ai.length;
    var Ri = numeric.rep([n],0),Rj=Array(m), Rv = Array(m);
    var counts = numeric.rep([n],0),i;
    for(i=0;i<m;++i) counts[Aj[i]]++;
    for(i=0;i<n;++i) Ri[i+1] = Ri[i] + counts[i];
    var ptr = Ri.slice(0),k,Aii;
    for(i=0;i<m;++i) {
        Aii = Aj[i];
        k = ptr[Aii];
        Rj[k] = Ai[i];
        Rv[k] = Av[i];
        ptr[Aii]=ptr[Aii]+1;
    }
    return [Ri,Rj,Rv];
};

numeric.ccsGather = function ccsGather(A) {
    var Ai = A[0], Aj = A[1], Av = A[2];
    var n = Ai.length-1,m = Aj.length;
    var Ri = Array(m), Rj = Array(m), Rv = Array(m);
    var i,j,j0,j1,p;
    p=0;
    for(i=0;i<n;++i) {
        j0 = Ai[i];
        j1 = Ai[i+1];
        for(j=j0;j!==j1;++j) {
            Rj[p] = i;
            Ri[p] = Aj[j];
            Rv[p] = Av[j];
            ++p;
        }
    }
    return [Ri,Rj,Rv];
};

// The following sparse linear algebra routines are deprecated.

numeric.sdim = function dim(A,ret,k) {
    if(typeof ret === "undefined") { ret = []; }
    if(typeof A !== "object") return ret;
    if(typeof k === "undefined") { k=0; }
    if(!(k in ret)) { ret[k] = 0; }
    if(A.length > ret[k]) ret[k] = A.length;
    var i;
    for(i in A) {
        if(A.hasOwnProperty(i)) dim(A[i],ret,k+1);
    }
    return ret;
};

numeric.sclone = function clone(A,k,n) {
    if(typeof k === "undefined") { k=0; }
    if(typeof n === "undefined") { n = numeric.sdim(A).length; }
    var i,ret = Array(A.length);
    if(k === n-1) {
        for(i in A) { if(A.hasOwnProperty(i)) ret[i] = A[i]; }
        return ret;
    }
    for(i in A) {
        if(A.hasOwnProperty(i)) ret[i] = clone(A[i],k+1,n);
    }
    return ret;
};

numeric.sdiag = function diag(d) {
    var n = d.length,i,ret = Array(n),i1;
    for(i=n-1;i>=1;i-=2) {
        i1 = i-1;
        ret[i] = []; ret[i][i] = d[i];
        ret[i1] = []; ret[i1][i1] = d[i1];
    }
    if(i===0) { ret[0] = []; ret[0][0] = d[i]; }
    return ret;
};

numeric.sidentity = function identity(n) { return numeric.sdiag(numeric.rep([n],1)); };

numeric.stranspose = function transpose(A) {
    var ret = []; A.length; var i,j,Ai;
    for(i in A) {
        if(!(A.hasOwnProperty(i))) continue;
        Ai = A[i];
        for(j in Ai) {
            if(!(Ai.hasOwnProperty(j))) continue;
            if(typeof ret[j] !== "object") { ret[j] = []; }
            ret[j][i] = Ai[j];
        }
    }
    return ret;
};

numeric.sLUP = function LUP(A,tol) {
    throw new Error("The function numeric.sLUP had a bug in it and has been removed. Please use the new numeric.ccsLUP function instead.");
};

numeric.sdotMM = function dotMM(A,B) {
    var p = A.length; B.length; var BT = numeric.stranspose(B), r = BT.length, Ai, BTk;
    var i,j,k,accum;
    var ret = Array(p),reti;
    for(i=p-1;i>=0;i--) {
        reti = [];
        Ai = A[i];
        for(k=r-1;k>=0;k--) {
            accum = 0;
            BTk = BT[k];
            for(j in Ai) {
                if(!(Ai.hasOwnProperty(j))) continue;
                if(j in BTk) { accum += Ai[j]*BTk[j]; }
            }
            if(accum) reti[k] = accum;
        }
        ret[i] = reti;
    }
    return ret;
};

numeric.sdotMV = function dotMV(A,x) {
    var p = A.length, Ai, i,j;
    var ret = Array(p), accum;
    for(i=p-1;i>=0;i--) {
        Ai = A[i];
        accum = 0;
        for(j in Ai) {
            if(!(Ai.hasOwnProperty(j))) continue;
            if(x[j]) accum += Ai[j]*x[j];
        }
        if(accum) ret[i] = accum;
    }
    return ret;
};

numeric.sdotVM = function dotMV(x,A) {
    var i,j,Ai,alpha;
    var ret = [];
    for(i in x) {
        if(!x.hasOwnProperty(i)) continue;
        Ai = A[i];
        alpha = x[i];
        for(j in Ai) {
            if(!Ai.hasOwnProperty(j)) continue;
            if(!ret[j]) { ret[j] = 0; }
            ret[j] += alpha*Ai[j];
        }
    }
    return ret;
};

numeric.sdotVV = function dotVV(x,y) {
    var i,ret=0;
    for(i in x) { if(x[i] && y[i]) ret+= x[i]*y[i]; }
    return ret;
};

numeric.sdot = function dot(A,B) {
    var m = numeric.sdim(A).length, n = numeric.sdim(B).length;
    var k = m*1000+n;
    switch(k) {
    case 0: return A*B;
    case 1001: return numeric.sdotVV(A,B);
    case 2001: return numeric.sdotMV(A,B);
    case 1002: return numeric.sdotVM(A,B);
    case 2002: return numeric.sdotMM(A,B);
    default: throw new Error('numeric.sdot not implemented for tensors of order '+m+' and '+n);
    }
};

numeric.sscatter = function scatter(V) {
    var n = V[0].length, Vij, i, j, m = V.length, A = [], Aj;
    for(i=n-1;i>=0;--i) {
        if(!V[m-1][i]) continue;
        Aj = A;
        for(j=0;j<m-2;j++) {
            Vij = V[j][i];
            if(!Aj[Vij]) Aj[Vij] = [];
            Aj = Aj[Vij];
        }
        Aj[V[j][i]] = V[j+1][i];
    }
    return A;
};

numeric.sgather = function gather(A,ret,k) {
    if(typeof ret === "undefined") ret = [];
    if(typeof k === "undefined") k = [];
    var n,i,Ai;
    n = k.length;
    for(i in A) {
        if(A.hasOwnProperty(i)) {
            k[n] = parseInt(i);
            Ai = A[i];
            if(typeof Ai === "number") {
                if(Ai) {
                    if(ret.length === 0) {
                        for(i=n+1;i>=0;--i) ret[i] = [];
                    }
                    for(i=n;i>=0;--i) ret[i].push(k[i]);
                    ret[n+1].push(Ai);
                }
            } else gather(Ai,ret,k);
        }
    }
    if(k.length>n) k.pop();
    return ret;
};

// 6. Coordinate matrices
numeric.cLU = function LU(A) {
    var I = A[0], J = A[1], V = A[2];
    var p = I.length, m=0, i,j,k,a,b,c;
    for(i=0;i<p;i++) if(I[i]>m) m=I[i];
    m++;
    var L = Array(m), U = Array(m), left = numeric.rep([m],Infinity), right = numeric.rep([m],-Infinity);
    var Ui, Uj,alpha;
    for(k=0;k<p;k++) {
        i = I[k];
        j = J[k];
        if(j<left[i]) left[i] = j;
        if(j>right[i]) right[i] = j;
    }
    for(i=0;i<m-1;i++) { if(right[i] > right[i+1]) right[i+1] = right[i]; }
    for(i=m-1;i>=1;i--) { if(left[i]<left[i-1]) left[i-1] = left[i]; }
    var countL = 0, countU = 0;
    for(i=0;i<m;i++) {
        U[i] = numeric.rep([right[i]-left[i]+1],0);
        L[i] = numeric.rep([i-left[i]],0);
        countL += i-left[i]+1;
        countU += right[i]-i+1;
    }
    for(k=0;k<p;k++) { i = I[k]; U[i][J[k]-left[i]] = V[k]; }
    for(i=0;i<m-1;i++) {
        a = i-left[i];
        Ui = U[i];
        for(j=i+1;left[j]<=i && j<m;j++) {
            b = i-left[j];
            c = right[i]-i;
            Uj = U[j];
            alpha = Uj[b]/Ui[a];
            if(alpha) {
                for(k=1;k<=c;k++) { Uj[k+b] -= alpha*Ui[k+a]; }
                L[j][i-left[j]] = alpha;
            }
        }
    }
    var Ui = [], Uj = [], Uv = [], Li = [], Lj = [], Lv = [];
    var p,q,foo;
    p=0; q=0;
    for(i=0;i<m;i++) {
        a = left[i];
        b = right[i];
        foo = U[i];
        for(j=i;j<=b;j++) {
            if(foo[j-a]) {
                Ui[p] = i;
                Uj[p] = j;
                Uv[p] = foo[j-a];
                p++;
            }
        }
        foo = L[i];
        for(j=a;j<i;j++) {
            if(foo[j-a]) {
                Li[q] = i;
                Lj[q] = j;
                Lv[q] = foo[j-a];
                q++;
            }
        }
        Li[q] = i;
        Lj[q] = i;
        Lv[q] = 1;
        q++;
    }
    return {U:[Ui,Uj,Uv], L:[Li,Lj,Lv]};
};

numeric.cLUsolve = function LUsolve(lu,b) {
    var L = lu.L, U = lu.U, ret = numeric.clone(b);
    var Li = L[0], Lj = L[1], Lv = L[2];
    var Ui = U[0], Uj = U[1], Uv = U[2];
    var p = Ui.length; Li.length;
    var m = ret.length,i,k;
    k = 0;
    for(i=0;i<m;i++) {
        while(Lj[k] < i) {
            ret[i] -= Lv[k]*ret[Lj[k]];
            k++;
        }
        k++;
    }
    k = p-1;
    for(i=m-1;i>=0;i--) {
        while(Uj[k] > i) {
            ret[i] -= Uv[k]*ret[Uj[k]];
            k--;
        }
        ret[i] /= Uv[k];
        k--;
    }
    return ret;
};

numeric.cgrid = function grid(n,shape) {
    if(typeof n === "number") n = [n,n];
    var ret = numeric.rep(n,-1);
    var i,j,count;
    if(typeof shape !== "function") {
        switch(shape) {
        case 'L':
            shape = function(i,j) { return (i>=n[0]/2 || j<n[1]/2); };
            break;
        default:
            shape = function(i,j) { return true; };
            break;
        }
    }
    count=0;
    for(i=1;i<n[0]-1;i++) for(j=1;j<n[1]-1;j++) 
        if(shape(i,j)) {
            ret[i][j] = count;
            count++;
        }
    return ret;
};

numeric.cdelsq = function delsq(g) {
    var dir = [[-1,0],[0,-1],[0,1],[1,0]];
    var s = numeric.dim(g), m = s[0], n = s[1], i,j,k,p,q;
    var Li = [], Lj = [], Lv = [];
    for(i=1;i<m-1;i++) for(j=1;j<n-1;j++) {
        if(g[i][j]<0) continue;
        for(k=0;k<4;k++) {
            p = i+dir[k][0];
            q = j+dir[k][1];
            if(g[p][q]<0) continue;
            Li.push(g[i][j]);
            Lj.push(g[p][q]);
            Lv.push(-1);
        }
        Li.push(g[i][j]);
        Lj.push(g[i][j]);
        Lv.push(4);
    }
    return [Li,Lj,Lv];
};

numeric.cdotMV = function dotMV(A,x) {
    var ret, Ai = A[0], Aj = A[1], Av = A[2],k,p=Ai.length,N;
    N=0;
    for(k=0;k<p;k++) { if(Ai[k]>N) N = Ai[k]; }
    N++;
    ret = numeric.rep([N],0);
    for(k=0;k<p;k++) { ret[Ai[k]]+=Av[k]*x[Aj[k]]; }
    return ret;
};

// 7. Splines

numeric.Spline = function Spline(x,yl,yr,kl,kr) { this.x = x; this.yl = yl; this.yr = yr; this.kl = kl; this.kr = kr; };
numeric.Spline.prototype._at = function _at(x1,p) {
    var x = this.x;
    var yl = this.yl;
    var yr = this.yr;
    var kl = this.kl;
    var kr = this.kr;
    var x1,a,b,t;
    var add = numeric.add, sub = numeric.sub, mul = numeric.mul;
    a = sub(mul(kl[p],x[p+1]-x[p]),sub(yr[p+1],yl[p]));
    b = add(mul(kr[p+1],x[p]-x[p+1]),sub(yr[p+1],yl[p]));
    t = (x1-x[p])/(x[p+1]-x[p]);
    var s = t*(1-t);
    return add(add(add(mul(1-t,yl[p]),mul(t,yr[p+1])),mul(a,s*(1-t))),mul(b,s*t));
};
numeric.Spline.prototype.at = function at(x0) {
    if(typeof x0 === "number") {
        var x = this.x;
        var n = x.length;
        var p,q,mid,floor = Math.floor;
        p = 0;
        q = n-1;
        while(q-p>1) {
            mid = floor((p+q)/2);
            if(x[mid] <= x0) p = mid;
            else q = mid;
        }
        return this._at(x0,p);
    }
    var n = x0.length, i, ret = Array(n);
    for(i=n-1;i!==-1;--i) ret[i] = this.at(x0[i]);
    return ret;
};
numeric.Spline.prototype.diff = function diff() {
    var x = this.x;
    var yl = this.yl;
    var yr = this.yr;
    var kl = this.kl;
    var kr = this.kr;
    var n = yl.length;
    var i,dx,dy;
    var zl = kl, zr = kr, pl = Array(n), pr = Array(n);
    var add = numeric.add, mul = numeric.mul, div = numeric.div, sub = numeric.sub;
    for(i=n-1;i!==-1;--i) {
        dx = x[i+1]-x[i];
        dy = sub(yr[i+1],yl[i]);
        pl[i] = div(add(mul(dy, 6),mul(kl[i],-4*dx),mul(kr[i+1],-2*dx)),dx*dx);
        pr[i+1] = div(add(mul(dy,-6),mul(kl[i], 2*dx),mul(kr[i+1], 4*dx)),dx*dx);
    }
    return new numeric.Spline(x,zl,zr,pl,pr);
};
numeric.Spline.prototype.roots = function roots() {
    function sqr(x) { return x*x; }
    var ret = [];
    var x = this.x, yl = this.yl, yr = this.yr, kl = this.kl, kr = this.kr;
    if(typeof yl[0] === "number") {
        yl = [yl];
        yr = [yr];
        kl = [kl];
        kr = [kr];
    }
    var m = yl.length,n=x.length-1,i,j,k;
    var ai,bi,ci,di, ret = Array(m),ri,k0,k1,y0,y1,A,B,D,dx,stops,z0,z1,zm,t0,t1,tm;
    var sqrt = Math.sqrt;
    for(i=0;i!==m;++i) {
        ai = yl[i];
        bi = yr[i];
        ci = kl[i];
        di = kr[i];
        ri = [];
        for(j=0;j!==n;j++) {
            if(j>0 && bi[j]*ai[j]<0) ri.push(x[j]);
            dx = (x[j+1]-x[j]);
            y0 = ai[j];
            y1 = bi[j+1];
            k0 = ci[j]/dx;
            k1 = di[j+1]/dx;
            D = sqr(k0-k1+3*(y0-y1)) + 12*k1*y0;
            A = k1+3*y0+2*k0-3*y1;
            B = 3*(k1+k0+2*(y0-y1));
            if(D<=0) {
                z0 = A/B;
                if(z0>x[j] && z0<x[j+1]) stops = [x[j],z0,x[j+1]];
                else stops = [x[j],x[j+1]];
            } else {
                z0 = (A-sqrt(D))/B;
                z1 = (A+sqrt(D))/B;
                stops = [x[j]];
                if(z0>x[j] && z0<x[j+1]) stops.push(z0);
                if(z1>x[j] && z1<x[j+1]) stops.push(z1);
                stops.push(x[j+1]);
            }
            t0 = stops[0];
            z0 = this._at(t0,j);
            for(k=0;k<stops.length-1;k++) {
                t1 = stops[k+1];
                z1 = this._at(t1,j);
                if(z0 === 0) {
                    ri.push(t0); 
                    t0 = t1;
                    z0 = z1;
                    continue;
                }
                if(z1 === 0 || z0*z1>0) {
                    t0 = t1;
                    z0 = z1;
                    continue;
                }
                var side = 0;
                while(1) {
                    tm = (z0*t1-z1*t0)/(z0-z1);
                    if(tm <= t0 || tm >= t1) { break; }
                    zm = this._at(tm,j);
                    if(zm*z1>0) {
                        t1 = tm;
                        z1 = zm;
                        if(side === -1) z0*=0.5;
                        side = -1;
                    } else if(zm*z0>0) {
                        t0 = tm;
                        z0 = zm;
                        if(side === 1) z1*=0.5;
                        side = 1;
                    } else break;
                }
                ri.push(tm);
                t0 = stops[k+1];
                z0 = this._at(t0, j);
            }
            if(z1 === 0) ri.push(t1);
        }
        ret[i] = ri;
    }
    if(typeof this.yl[0] === "number") return ret[0];
    return ret;
};
numeric.spline = function spline(x,y,k1,kn) {
    var n = x.length, b = [], dx = [], dy = [];
    var i;
    var sub = numeric.sub,mul = numeric.mul,add = numeric.add;
    for(i=n-2;i>=0;i--) { dx[i] = x[i+1]-x[i]; dy[i] = sub(y[i+1],y[i]); }
    if(typeof k1 === "string" || typeof kn === "string") { 
        k1 = kn = "periodic";
    }
    // Build sparse tridiagonal system
    var T = [[],[],[]];
    switch(typeof k1) {
    case "undefined":
        b[0] = mul(3/(dx[0]*dx[0]),dy[0]);
        T[0].push(0,0);
        T[1].push(0,1);
        T[2].push(2/dx[0],1/dx[0]);
        break;
    case "string":
        b[0] = add(mul(3/(dx[n-2]*dx[n-2]),dy[n-2]),mul(3/(dx[0]*dx[0]),dy[0]));
        T[0].push(0,0,0);
        T[1].push(n-2,0,1);
        T[2].push(1/dx[n-2],2/dx[n-2]+2/dx[0],1/dx[0]);
        break;
    default:
        b[0] = k1;
        T[0].push(0);
        T[1].push(0);
        T[2].push(1);
        break;
    }
    for(i=1;i<n-1;i++) {
        b[i] = add(mul(3/(dx[i-1]*dx[i-1]),dy[i-1]),mul(3/(dx[i]*dx[i]),dy[i]));
        T[0].push(i,i,i);
        T[1].push(i-1,i,i+1);
        T[2].push(1/dx[i-1],2/dx[i-1]+2/dx[i],1/dx[i]);
    }
    switch(typeof kn) {
    case "undefined":
        b[n-1] = mul(3/(dx[n-2]*dx[n-2]),dy[n-2]);
        T[0].push(n-1,n-1);
        T[1].push(n-2,n-1);
        T[2].push(1/dx[n-2],2/dx[n-2]);
        break;
    case "string":
        T[1][T[1].length-1] = 0;
        break;
    default:
        b[n-1] = kn;
        T[0].push(n-1);
        T[1].push(n-1);
        T[2].push(1);
        break;
    }
    if(typeof b[0] !== "number") b = numeric.transpose(b);
    else b = [b];
    var k = Array(b.length);
    if(typeof k1 === "string") {
        for(i=k.length-1;i!==-1;--i) {
            k[i] = numeric.ccsLUPSolve(numeric.ccsLUP(numeric.ccsScatter(T)),b[i]);
            k[i][n-1] = k[i][0];
        }
    } else {
        for(i=k.length-1;i!==-1;--i) {
            k[i] = numeric.cLUsolve(numeric.cLU(T),b[i]);
        }
    }
    if(typeof y[0] === "number") k = k[0];
    else k = numeric.transpose(k);
    return new numeric.Spline(x,y,y,k,k);
};

// 8. FFT
numeric.fftpow2 = function fftpow2(x,y) {
    var n = x.length;
    if(n === 1) return;
    var cos = Math.cos, sin = Math.sin, i,j;
    var xe = Array(n/2), ye = Array(n/2), xo = Array(n/2), yo = Array(n/2);
    j = n/2;
    for(i=n-1;i!==-1;--i) {
        --j;
        xo[j] = x[i];
        yo[j] = y[i];
        --i;
        xe[j] = x[i];
        ye[j] = y[i];
    }
    fftpow2(xe,ye);
    fftpow2(xo,yo);
    j = n/2;
    var t,k = (-6.2831853071795864769252867665590057683943387987502116419/n),ci,si;
    for(i=n-1;i!==-1;--i) {
        --j;
        if(j === -1) j = n/2-1;
        t = k*i;
        ci = cos(t);
        si = sin(t);
        x[i] = xe[j] + ci*xo[j] - si*yo[j];
        y[i] = ye[j] + ci*yo[j] + si*xo[j];
    }
};
numeric._ifftpow2 = function _ifftpow2(x,y) {
    var n = x.length;
    if(n === 1) return;
    var cos = Math.cos, sin = Math.sin, i,j;
    var xe = Array(n/2), ye = Array(n/2), xo = Array(n/2), yo = Array(n/2);
    j = n/2;
    for(i=n-1;i!==-1;--i) {
        --j;
        xo[j] = x[i];
        yo[j] = y[i];
        --i;
        xe[j] = x[i];
        ye[j] = y[i];
    }
    _ifftpow2(xe,ye);
    _ifftpow2(xo,yo);
    j = n/2;
    var t,k = (6.2831853071795864769252867665590057683943387987502116419/n),ci,si;
    for(i=n-1;i!==-1;--i) {
        --j;
        if(j === -1) j = n/2-1;
        t = k*i;
        ci = cos(t);
        si = sin(t);
        x[i] = xe[j] + ci*xo[j] - si*yo[j];
        y[i] = ye[j] + ci*yo[j] + si*xo[j];
    }
};
numeric.ifftpow2 = function ifftpow2(x,y) {
    numeric._ifftpow2(x,y);
    numeric.diveq(x,x.length);
    numeric.diveq(y,y.length);
};
numeric.convpow2 = function convpow2(ax,ay,bx,by) {
    numeric.fftpow2(ax,ay);
    numeric.fftpow2(bx,by);
    var i,n = ax.length,axi,bxi,ayi,byi;
    for(i=n-1;i!==-1;--i) {
        axi = ax[i]; ayi = ay[i]; bxi = bx[i]; byi = by[i];
        ax[i] = axi*bxi-ayi*byi;
        ay[i] = axi*byi+ayi*bxi;
    }
    numeric.ifftpow2(ax,ay);
};
numeric.T.prototype.fft = function fft() {
    var x = this.x, y = this.y;
    var n = x.length, log = Math.log, log2 = log(2),
        p = Math.ceil(log(2*n-1)/log2), m = Math.pow(2,p);
    var cx = numeric.rep([m],0), cy = numeric.rep([m],0), cos = Math.cos, sin = Math.sin;
    var k, c = (-3.141592653589793238462643383279502884197169399375105820/n),t;
    var a = numeric.rep([m],0), b = numeric.rep([m],0);
    for(k=0;k<n;k++) a[k] = x[k];
    if(typeof y !== "undefined") for(k=0;k<n;k++) b[k] = y[k];
    cx[0] = 1;
    for(k=1;k<=m/2;k++) {
        t = c*k*k;
        cx[k] = cos(t);
        cy[k] = sin(t);
        cx[m-k] = cos(t);
        cy[m-k] = sin(t);
    }
    var X = new numeric.T(a,b), Y = new numeric.T(cx,cy);
    X = X.mul(Y);
    numeric.convpow2(X.x,X.y,numeric.clone(Y.x),numeric.neg(Y.y));
    X = X.mul(Y);
    X.x.length = n;
    X.y.length = n;
    return X;
};
numeric.T.prototype.ifft = function ifft() {
    var x = this.x, y = this.y;
    var n = x.length, log = Math.log, log2 = log(2),
        p = Math.ceil(log(2*n-1)/log2), m = Math.pow(2,p);
    var cx = numeric.rep([m],0), cy = numeric.rep([m],0), cos = Math.cos, sin = Math.sin;
    var k, c = (3.141592653589793238462643383279502884197169399375105820/n),t;
    var a = numeric.rep([m],0), b = numeric.rep([m],0);
    for(k=0;k<n;k++) a[k] = x[k];
    if(typeof y !== "undefined") for(k=0;k<n;k++) b[k] = y[k];
    cx[0] = 1;
    for(k=1;k<=m/2;k++) {
        t = c*k*k;
        cx[k] = cos(t);
        cy[k] = sin(t);
        cx[m-k] = cos(t);
        cy[m-k] = sin(t);
    }
    var X = new numeric.T(a,b), Y = new numeric.T(cx,cy);
    X = X.mul(Y);
    numeric.convpow2(X.x,X.y,numeric.clone(Y.x),numeric.neg(Y.y));
    X = X.mul(Y);
    X.x.length = n;
    X.y.length = n;
    return X.div(n);
};

//9. Unconstrained optimization
numeric.gradient = function gradient(f,x) {
    var n = x.length;
    var f0 = f(x);
    if(isNaN(f0)) throw new Error('gradient: f(x) is a NaN!');
    var max = Math.max;
    var i,x0 = numeric.clone(x),f1,f2, J = Array(n);
    numeric.div; numeric.sub;var errest,max = Math.max,eps = 1e-3,abs = Math.abs, min = Math.min;
    var t0,t1,t2,it=0,d1,d2,N;
    for(i=0;i<n;i++) {
        var h = max(1e-6*f0,1e-8);
        while(1) {
            ++it;
            if(it>20) { throw new Error("Numerical gradient fails"); }
            x0[i] = x[i]+h;
            f1 = f(x0);
            x0[i] = x[i]-h;
            f2 = f(x0);
            x0[i] = x[i];
            if(isNaN(f1) || isNaN(f2)) { h/=16; continue; }
            J[i] = (f1-f2)/(2*h);
            t0 = x[i]-h;
            t1 = x[i];
            t2 = x[i]+h;
            d1 = (f1-f0)/h;
            d2 = (f0-f2)/h;
            N = max(abs(J[i]),abs(f0),abs(f1),abs(f2),abs(t0),abs(t1),abs(t2),1e-8);
            errest = min(max(abs(d1-J[i]),abs(d2-J[i]),abs(d1-d2))/N,h/N);
            if(errest>eps) { h/=16; }
            else break;
            }
    }
    return J;
};

numeric.uncmin = function uncmin(f,x0,tol,gradient,maxit,callback,options) {
    var grad = numeric.gradient;
    if(typeof options === "undefined") { options = {}; }
    if(typeof tol === "undefined") { tol = 1e-8; }
    if(typeof gradient === "undefined") { gradient = function(x) { return grad(f,x); }; }
    if(typeof maxit === "undefined") maxit = 1000;
    x0 = numeric.clone(x0);
    var n = x0.length;
    var f0 = f(x0),f1,df0;
    if(isNaN(f0)) throw new Error('uncmin: f(x0) is a NaN!');
    var max = Math.max, norm2 = numeric.norm2;
    tol = max(tol,numeric.epsilon);
    var step,g0,g1,H1 = options.Hinv || numeric.identity(n);
    var dot = numeric.dot; numeric.inv; var sub = numeric.sub, add = numeric.add, ten = numeric.tensor, div = numeric.div, mul = numeric.mul;
    var all = numeric.all, isfinite = numeric.isFinite, neg = numeric.neg;
    var it=0,s,x1,y,Hy,ys,t,nstep;
    var msg = "";
    g0 = gradient(x0);
    while(it<maxit) {
        if(typeof callback === "function") { if(callback(it,x0,f0,g0,H1)) { msg = "Callback returned true"; break; } }
        if(!all(isfinite(g0))) { msg = "Gradient has Infinity or NaN"; break; }
        step = neg(dot(H1,g0));
        if(!all(isfinite(step))) { msg = "Search direction has Infinity or NaN"; break; }
        nstep = norm2(step);
        if(nstep < tol) { msg="Newton step smaller than tol"; break; }
        t = 1;
        df0 = dot(g0,step);
        // line search
        x1 = x0;
        while(it < maxit) {
            if(t*nstep < tol) { break; }
            s = mul(step,t);
            x1 = add(x0,s);
            f1 = f(x1);
            if(f1-f0 >= 0.1*t*df0 || isNaN(f1)) {
                t *= 0.5;
                ++it;
                continue;
            }
            break;
        }
        if(t*nstep < tol) { msg = "Line search step size smaller than tol"; break; }
        if(it === maxit) { msg = "maxit reached during line search"; break; }
        g1 = gradient(x1);
        y = sub(g1,g0);
        ys = dot(y,s);
        Hy = dot(H1,y);
        H1 = sub(add(H1,
                mul(
                        (ys+dot(y,Hy))/(ys*ys),
                        ten(s,s)    )),
                div(add(ten(Hy,s),ten(s,Hy)),ys));
        x0 = x1;
        f0 = f1;
        g0 = g1;
        ++it;
    }
    return {solution: x0, f: f0, gradient: g0, invHessian: H1, iterations:it, message: msg};
};

// 10. Ode solver (Dormand-Prince)
numeric.Dopri = function Dopri(x,y,f,ymid,iterations,msg,events) {
    this.x = x;
    this.y = y;
    this.f = f;
    this.ymid = ymid;
    this.iterations = iterations;
    this.events = events;
    this.message = msg;
};
numeric.Dopri.prototype._at = function _at(xi,j) {
    function sqr(x) { return x*x; }
    var sol = this;
    var xs = sol.x;
    var ys = sol.y;
    var k1 = sol.f;
    var ymid = sol.ymid;
    xs.length;
    var x0,x1,xh,y0,y1,yh,xi;
    var h;
    var c = 0.5;
    var add = numeric.add, mul = numeric.mul,sub = numeric.sub, p,q,w;
    x0 = xs[j];
    x1 = xs[j+1];
    y0 = ys[j];
    y1 = ys[j+1];
    h  = x1-x0;
    xh = x0+c*h;
    yh = ymid[j];
    p = sub(k1[j  ],mul(y0,1/(x0-xh)+2/(x0-x1)));
    q = sub(k1[j+1],mul(y1,1/(x1-xh)+2/(x1-x0)));
    w = [sqr(xi - x1) * (xi - xh) / sqr(x0 - x1) / (x0 - xh),
         sqr(xi - x0) * sqr(xi - x1) / sqr(x0 - xh) / sqr(x1 - xh),
         sqr(xi - x0) * (xi - xh) / sqr(x1 - x0) / (x1 - xh),
         (xi - x0) * sqr(xi - x1) * (xi - xh) / sqr(x0-x1) / (x0 - xh),
         (xi - x1) * sqr(xi - x0) * (xi - xh) / sqr(x0-x1) / (x1 - xh)];
    return add(add(add(add(mul(y0,w[0]),
                           mul(yh,w[1])),
                           mul(y1,w[2])),
                           mul( p,w[3])),
                           mul( q,w[4]));
};
numeric.Dopri.prototype.at = function at(x) {
    var i,j,k,floor = Math.floor;
    if(typeof x !== "number") {
        var n = x.length, ret = Array(n);
        for(i=n-1;i!==-1;--i) {
            ret[i] = this.at(x[i]);
        }
        return ret;
    }
    var x0 = this.x;
    i = 0; j = x0.length-1;
    while(j-i>1) {
        k = floor(0.5*(i+j));
        if(x0[k] <= x) i = k;
        else j = k;
    }
    return this._at(x,i);
};

numeric.dopri = function dopri(x0,x1,y0,f,tol,maxit,event) {
    if(typeof tol === "undefined") { tol = 1e-6; }
    if(typeof maxit === "undefined") { maxit = 1000; }
    var xs = [x0], ys = [y0], k1 = [f(x0,y0)], k2,k3,k4,k5,k6,k7, ymid = [];
    var A2 = 1/5;
    var A3 = [3/40,9/40];
    var A4 = [44/45,-56/15,32/9];
    var A5 = [19372/6561,-25360/2187,64448/6561,-212/729];
    var A6 = [9017/3168,-355/33,46732/5247,49/176,-5103/18656];
    var b = [35/384,0,500/1113,125/192,-2187/6784,11/84];
    var bm = [0.5*6025192743/30085553152,
              0,
              0.5*51252292925/65400821598,
              0.5*-2691868925/45128329728,
              0.5*187940372067/1594534317056,
              0.5*-1776094331/19743644256,
              0.5*11237099/235043384];
    var c = [1/5,3/10,4/5,8/9,1,1];
    var e = [-71/57600,0,71/16695,-71/1920,17253/339200,-22/525,1/40];
    var i = 0,er,j;
    var h = (x1-x0)/10;
    var it = 0;
    var add = numeric.add, mul = numeric.mul, y1,erinf;
    var min = Math.min, abs = Math.abs, norminf = numeric.norminf,pow = Math.pow;
    var any = numeric.any, lt = numeric.lt, and = numeric.and; numeric.sub;
    var e0, e1, ev;
    var ret = new numeric.Dopri(xs,ys,k1,ymid,-1,"");
    if(typeof event === "function") e0 = event(x0,y0);
    while(x0<x1 && it<maxit) {
        ++it;
        if(x0+h>x1) h = x1-x0;
        k2 = f(x0+c[0]*h,                add(y0,mul(   A2*h,k1[i])));
        k3 = f(x0+c[1]*h,            add(add(y0,mul(A3[0]*h,k1[i])),mul(A3[1]*h,k2)));
        k4 = f(x0+c[2]*h,        add(add(add(y0,mul(A4[0]*h,k1[i])),mul(A4[1]*h,k2)),mul(A4[2]*h,k3)));
        k5 = f(x0+c[3]*h,    add(add(add(add(y0,mul(A5[0]*h,k1[i])),mul(A5[1]*h,k2)),mul(A5[2]*h,k3)),mul(A5[3]*h,k4)));
        k6 = f(x0+c[4]*h,add(add(add(add(add(y0,mul(A6[0]*h,k1[i])),mul(A6[1]*h,k2)),mul(A6[2]*h,k3)),mul(A6[3]*h,k4)),mul(A6[4]*h,k5)));
        y1 = add(add(add(add(add(y0,mul(k1[i],h*b[0])),mul(k3,h*b[2])),mul(k4,h*b[3])),mul(k5,h*b[4])),mul(k6,h*b[5]));
        k7 = f(x0+h,y1);
        er = add(add(add(add(add(mul(k1[i],h*e[0]),mul(k3,h*e[2])),mul(k4,h*e[3])),mul(k5,h*e[4])),mul(k6,h*e[5])),mul(k7,h*e[6]));
        if(typeof er === "number") erinf = abs(er);
        else erinf = norminf(er);
        if(erinf > tol) { // reject
            h = 0.2*h*pow(tol/erinf,0.25);
            if(x0+h === x0) {
                ret.msg = "Step size became too small";
                break;
            }
            continue;
        }
        ymid[i] = add(add(add(add(add(add(y0,
                mul(k1[i],h*bm[0])),
                mul(k3   ,h*bm[2])),
                mul(k4   ,h*bm[3])),
                mul(k5   ,h*bm[4])),
                mul(k6   ,h*bm[5])),
                mul(k7   ,h*bm[6]));
        ++i;
        xs[i] = x0+h;
        ys[i] = y1;
        k1[i] = k7;
        if(typeof event === "function") {
            var yi,xl = x0,xr = x0+0.5*h,xi;
            e1 = event(xr,ymid[i-1]);
            ev = and(lt(e0,0),lt(0,e1));
            if(!any(ev)) { xl = xr; xr = x0+h; e0 = e1; e1 = event(xr,y1); ev = and(lt(e0,0),lt(0,e1)); }
            if(any(ev)) {
                var en,ei;
                var side=0, sl = 1.0, sr = 1.0;
                while(1) {
                    if(typeof e0 === "number") xi = (sr*e1*xl-sl*e0*xr)/(sr*e1-sl*e0);
                    else {
                        xi = xr;
                        for(j=e0.length-1;j!==-1;--j) {
                            if(e0[j]<0 && e1[j]>0) xi = min(xi,(sr*e1[j]*xl-sl*e0[j]*xr)/(sr*e1[j]-sl*e0[j]));
                        }
                    }
                    if(xi <= xl || xi >= xr) break;
                    yi = ret._at(xi, i-1);
                    ei = event(xi,yi);
                    en = and(lt(e0,0),lt(0,ei));
                    if(any(en)) {
                        xr = xi;
                        e1 = ei;
                        ev = en;
                        sr = 1.0;
                        if(side === -1) sl *= 0.5;
                        else sl = 1.0;
                        side = -1;
                    } else {
                        xl = xi;
                        e0 = ei;
                        sl = 1.0;
                        if(side === 1) sr *= 0.5;
                        else sr = 1.0;
                        side = 1;
                    }
                }
                y1 = ret._at(0.5*(x0+xi),i-1);
                ret.f[i] = f(xi,yi);
                ret.x[i] = xi;
                ret.y[i] = yi;
                ret.ymid[i-1] = y1;
                ret.events = ev;
                ret.iterations = it;
                return ret;
            }
        }
        x0 += h;
        y0 = y1;
        e0 = e1;
        h = min(0.8*h*pow(tol/erinf,0.25),4*h);
    }
    ret.iterations = it;
    return ret;
};

// 11. Ax = b
numeric.LU = function(A, fast) {
  fast = fast || false;

  var abs = Math.abs;
  var i, j, k, absAjk, Akk, Ak, Pk, Ai;
  var max;
  var n = A.length, n1 = n-1;
  var P = new Array(n);
  if(!fast) A = numeric.clone(A);

  for (k = 0; k < n; ++k) {
    Pk = k;
    Ak = A[k];
    max = abs(Ak[k]);
    for (j = k + 1; j < n; ++j) {
      absAjk = abs(A[j][k]);
      if (max < absAjk) {
        max = absAjk;
        Pk = j;
      }
    }
    P[k] = Pk;

    if (Pk != k) {
      A[k] = A[Pk];
      A[Pk] = Ak;
      Ak = A[k];
    }

    Akk = Ak[k];

    for (i = k + 1; i < n; ++i) {
      A[i][k] /= Akk;
    }

    for (i = k + 1; i < n; ++i) {
      Ai = A[i];
      for (j = k + 1; j < n1; ++j) {
        Ai[j] -= Ai[k] * Ak[j];
        ++j;
        Ai[j] -= Ai[k] * Ak[j];
      }
      if(j===n1) Ai[j] -= Ai[k] * Ak[j];
    }
  }

  return {
    LU: A,
    P:  P
  };
};

numeric.LUsolve = function LUsolve(LUP, b) {
  var i, j;
  var LU = LUP.LU;
  var n   = LU.length;
  var x = numeric.clone(b);
  var P   = LUP.P;
  var Pi, LUi, tmp;

  for (i=n-1;i!==-1;--i) x[i] = b[i];
  for (i = 0; i < n; ++i) {
    Pi = P[i];
    if (P[i] !== i) {
      tmp = x[i];
      x[i] = x[Pi];
      x[Pi] = tmp;
    }

    LUi = LU[i];
    for (j = 0; j < i; ++j) {
      x[i] -= x[j] * LUi[j];
    }
  }

  for (i = n - 1; i >= 0; --i) {
    LUi = LU[i];
    for (j = i + 1; j < n; ++j) {
      x[i] -= x[j] * LUi[j];
    }

    x[i] /= LUi[i];
  }

  return x;
};

numeric.solve = function solve(A,b,fast) { return numeric.LUsolve(numeric.LU(A,fast), b); };

// 12. Linear programming
numeric.echelonize = function echelonize(A) {
    var s = numeric.dim(A), m = s[0], n = s[1];
    var I = numeric.identity(m);
    var P = Array(m);
    var i,j,k,l,Ai,Ii,Z,a;
    var abs = Math.abs;
    var diveq = numeric.diveq;
    A = numeric.clone(A);
    for(i=0;i<m;++i) {
        k = 0;
        Ai = A[i];
        Ii = I[i];
        for(j=1;j<n;++j) if(abs(Ai[k])<abs(Ai[j])) k=j;
        P[i] = k;
        diveq(Ii,Ai[k]);
        diveq(Ai,Ai[k]);
        for(j=0;j<m;++j) if(j!==i) {
            Z = A[j]; a = Z[k];
            for(l=n-1;l!==-1;--l) Z[l] -= Ai[l]*a;
            Z = I[j];
            for(l=m-1;l!==-1;--l) Z[l] -= Ii[l]*a;
        }
    }
    return {I:I, A:A, P:P};
};

numeric.__solveLP = function __solveLP(c,A,b,tol,maxit,x,flag) {
    var sum = numeric.sum; numeric.log; var mul = numeric.mul, sub = numeric.sub, dot = numeric.dot, div = numeric.div, add = numeric.add;
    var m = c.length, n = b.length,y;
    var unbounded = false, i0=0;
    var alpha = 1.0;
    numeric.transpose(A); numeric.svd;var transpose = numeric.transpose;numeric.leq; var sqrt = Math.sqrt, abs = Math.abs;
    numeric.muleq;
    numeric.norminf; numeric.any;var min = Math.min;
    var all = numeric.all, gt = numeric.gt;
    var p = Array(m), A0 = Array(n);numeric.rep([n],1); var H;
    var solve = numeric.solve, z = sub(b,dot(A,x)),count;
    var dotcc = dot(c,c);
    var g;
    for(count=i0;count<maxit;++count) {
        var i,d;
        for(i=n-1;i!==-1;--i) A0[i] = div(A[i],z[i]);
        var A1 = transpose(A0);
        for(i=m-1;i!==-1;--i) p[i] = (/*x[i]+*/sum(A1[i]));
        alpha = 0.25*abs(dotcc/dot(c,p));
        var a1 = 100*sqrt(dotcc/dot(p,p));
        if(!isFinite(alpha) || alpha>a1) alpha = a1;
        g = add(c,mul(alpha,p));
        H = dot(A1,A0);
        for(i=m-1;i!==-1;--i) H[i][i] += 1;
        d = solve(H,div(g,alpha),true);
        var t0 = div(z,dot(A,d));
        var t = 1.0;
        for(i=n-1;i!==-1;--i) if(t0[i]<0) t = min(t,-0.999*t0[i]);
        y = sub(x,mul(d,t));
        z = sub(b,dot(A,y));
        if(!all(gt(z,0))) return { solution: x, message: "", iterations: count };
        x = y;
        if(alpha<tol) return { solution: y, message: "", iterations: count };
        if(flag) {
            var s = dot(c,g), Ag = dot(A,g);
            unbounded = true;
            for(i=n-1;i!==-1;--i) if(s*Ag[i]<0) { unbounded = false; break; }
        } else {
            if(x[m-1]>=0) unbounded = false;
            else unbounded = true;
        }
        if(unbounded) return { solution: y, message: "Unbounded", iterations: count };
    }
    return { solution: x, message: "maximum iteration count exceeded", iterations:count };
};

numeric._solveLP = function _solveLP(c,A,b,tol,maxit) {
    var m = c.length, n = b.length,y;
    numeric.sum; numeric.log; numeric.mul; var sub = numeric.sub, dot = numeric.dot; numeric.div; numeric.add;
    var c0 = numeric.rep([m],0).concat([1]);
    var J = numeric.rep([n,1],-1);
    var A0 = numeric.blockMatrix([[A                   ,   J  ]]);
    var b0 = b;
    var y = numeric.rep([m],0).concat(Math.max(0,numeric.sup(numeric.neg(b)))+1);
    var x0 = numeric.__solveLP(c0,A0,b0,tol,maxit,y,false);
    var x = numeric.clone(x0.solution);
    x.length = m;
    var foo = numeric.inf(sub(b,dot(A,x)));
    if(foo<0) { return { solution: NaN, message: "Infeasible", iterations: x0.iterations }; }
    var ret = numeric.__solveLP(c, A, b, tol, maxit-x0.iterations, x, true);
    ret.iterations += x0.iterations;
    return ret;
};

numeric.solveLP = function solveLP(c,A,b,Aeq,beq,tol,maxit) {
    if(typeof maxit === "undefined") maxit = 1000;
    if(typeof tol === "undefined") tol = numeric.epsilon;
    if(typeof Aeq === "undefined") return numeric._solveLP(c,A,b,tol,maxit);
    var m = Aeq.length, n = Aeq[0].length, o = A.length;
    var B = numeric.echelonize(Aeq);
    var flags = numeric.rep([n],0);
    var P = B.P;
    var Q = [];
    var i;
    for(i=P.length-1;i!==-1;--i) flags[P[i]] = 1;
    for(i=n-1;i!==-1;--i) if(flags[i]===0) Q.push(i);
    var g = numeric.getRange;
    var I = numeric.linspace(0,m-1), J = numeric.linspace(0,o-1);
    var Aeq2 = g(Aeq,I,Q), A1 = g(A,J,P), A2 = g(A,J,Q), dot = numeric.dot, sub = numeric.sub;
    var A3 = dot(A1,B.I);
    var A4 = sub(A2,dot(A3,Aeq2)), b4 = sub(b,dot(A3,beq));
    var c1 = Array(P.length), c2 = Array(Q.length);
    for(i=P.length-1;i!==-1;--i) c1[i] = c[P[i]];
    for(i=Q.length-1;i!==-1;--i) c2[i] = c[Q[i]];
    var c4 = sub(c2,dot(c1,dot(B.I,Aeq2)));
    var S = numeric._solveLP(c4,A4,b4,tol,maxit);
    var x2 = S.solution;
    if(x2!==x2) return S;
    var x1 = dot(B.I,sub(beq,dot(Aeq2,x2)));
    var x = Array(c.length);
    for(i=P.length-1;i!==-1;--i) x[P[i]] = x1[i];
    for(i=Q.length-1;i!==-1;--i) x[Q[i]] = x2[i];
    return { solution: x, message:S.message, iterations: S.iterations };
};

numeric.MPStoLP = function MPStoLP(MPS) {
    if(MPS instanceof String) { MPS.split('\n'); }
    var state = 0;
    var states = ['Initial state','NAME','ROWS','COLUMNS','RHS','BOUNDS','ENDATA'];
    var n = MPS.length;
    var i,j,z,N=0,rows = {}, sign = [], rl = 0, vars = {}, nv = 0;
    var name;
    var c = [], A = [], b = [];
    function err(e) { throw new Error('MPStoLP: '+e+'\nLine '+i+': '+MPS[i]+'\nCurrent state: '+states[state]+'\n'); }
    for(i=0;i<n;++i) {
        z = MPS[i];
        var w0 = z.match(/\S*/g);
        var w = [];
        for(j=0;j<w0.length;++j) if(w0[j]!=="") w.push(w0[j]);
        if(w.length === 0) continue;
        for(j=0;j<states.length;++j) if(z.substr(0,states[j].length) === states[j]) break;
        if(j<states.length) {
            state = j;
            if(j===1) { name = w[1]; }
            if(j===6) return { name:name, c:c, A:numeric.transpose(A), b:b, rows:rows, vars:vars };
            continue;
        }
        switch(state) {
        case 0: case 1: err('Unexpected line');
        case 2: 
            switch(w[0]) {
            case 'N': if(N===0) N = w[1]; else err('Two or more N rows'); break;
            case 'L': rows[w[1]] = rl; sign[rl] = 1; b[rl] = 0; ++rl; break;
            case 'G': rows[w[1]] = rl; sign[rl] = -1;b[rl] = 0; ++rl; break;
            case 'E': rows[w[1]] = rl; sign[rl] = 0;b[rl] = 0; ++rl; break;
            default: err('Parse error '+numeric.prettyPrint(w));
            }
            break;
        case 3:
            if(!vars.hasOwnProperty(w[0])) { vars[w[0]] = nv; c[nv] = 0; A[nv] = numeric.rep([rl],0); ++nv; }
            var p = vars[w[0]];
            for(j=1;j<w.length;j+=2) {
                if(w[j] === N) { c[p] = parseFloat(w[j+1]); continue; }
                var q = rows[w[j]];
                A[p][q] = (sign[q]<0?-1:1)*parseFloat(w[j+1]);
            }
            break;
        case 4:
            for(j=1;j<w.length;j+=2) b[rows[w[j]]] = (sign[rows[w[j]]]<0?-1:1)*parseFloat(w[j+1]);
            break;
        case 5: /*FIXME*/ break;
        case 6: err('Internal error');
        }
    }
    err('Reached end of file without ENDATA');
};

/**
 * Finds the index of range in which a query value is included in a sorted
 * array with binary search.
 * @param  xs Array sorted in ascending order.
 * @param  xq Query value.
 * @return    Index of range plus percentage to next index.
 */
function binaryFindIndex(xs, xq) {
    /* Special case of only one element in array. */
    if (xs.length === 1 && xs[0] === xq)
        return 0;
    /* Determine bounds. */
    var lower = 0;
    var upper = xs.length - 1;
    /* Find index of range. */
    while (lower < upper) {
        /* Determine test range. */
        var mid = Math.floor((lower + upper) / 2);
        var prev = xs[mid];
        var next = xs[mid + 1];
        if (xq < prev) {
            /* Query value is below range. */
            upper = mid;
        }
        else if (xq > next) {
            /* Query value is above range. */
            lower = mid + 1;
        }
        else {
            /* Query value is in range. */
            return mid + (xq - prev) / (next - prev);
        }
    }
    /* Range not found. */
    return -1;
}
/**
 * Interpolates a value.
 * @param  vs     Array of values to interpolate between.
 * @param  index  Index of new to be interpolated value.
 * @param  method Kind of interpolation. Can be 'linear', 'nearest', 'next' or 'previous'.
 * @return        Interpolated value.
 */
function interpolate(vs, index, method) {
    switch (method) {
        case 'nearest': {
            return vs[Math.round(index)];
        }
        case 'next': {
            return vs[Math.ceil(index)];
        }
        case 'previous': {
            return vs[Math.floor(index)];
        }
        case 'linear':
        default: {
            var prev = Math.floor(index);
            var next = Math.ceil(index);
            var lambda = index - prev;
            return (1 - lambda) * vs[prev] + lambda * vs[next];
        }
    }
}
/**
 * Interpolates values linearly in one dimension.
 * @param  xs     Array of independent sample points.
 * @param  vs     Array of dependent values v(x) with length equal to xs.
 * @param  xqs    Array of query points.
 * @param  method Method of interpolation.
 * @return        Interpolated values vq(xq) with length equal to xqs.
 */
function interp1(xs, vs, xqs, method) {
    if (method === void 0) { method = 'linear'; }
    /*
     * Throws an error if number of independent sample points is not equal to
     * the number of dependent values.
     */
    if (xs.length !== vs.length) {
        throw new Error("Arrays of sample points xs and corresponding values vs have to have\n      equal length.");
    }
    /* Combine x and v arrays. */
    var zipped = xs.map(function (x, index) { return [x, vs[index]]; });
    /* Sort points by independent variabel in ascending order. */
    zipped.sort(function (a, b) {
        var diff = a[0] - b[0];
        /* Check if some x value occurs twice. */
        if (diff === 0) {
            throw new Error('Two sample points have equal value ' + a[0] + '. This is not allowed.');
        }
        return diff;
    });
    /* Extract sorted x and v arrays */
    var sortedX = [];
    var sortedV = [];
    for (var i = 0; i < zipped.length; i++) {
        var point = zipped[i];
        sortedX.push(point[0]);
        sortedV.push(point[1]);
    }
    /* Interpolate values */
    var yqs = xqs.map(function (xq) {
        /* Determine index of range of query value. */
        var index = binaryFindIndex(sortedX, xq);
        /* Check if value lies in interpolation range. */
        if (index === -1) {
            throw new Error("Query value " + xq + " lies outside of range. Extrapolation is not\n        supported.");
        }
        /* Interpolate value. */
        return interpolate(sortedV, index, method);
    });
    /* Return result. */
    return yqs.slice();
}

console.log('jsQUEST Version 1.0.1');

// Copyright (c) 2021 Daiichiro Kuroki
// Released under the MIT license
//  
function QuestCreate(tGuess, tGuessSd, pThreshold, beta, delta, gamma, grain, range, plotIt){
    // q=QuestCreate(tGuess,tGuessSd,pThreshold,beta,delta,gamma,[grain],[range],[plotIt])

    // Create a struct q with all the information necessary to measure threshold. 
    // Threshold "t" is measured on an abstract "intensity" scale, which usually corresponds to log10 contrast.

    // QuestCreate saves in struct q the parameters for a Weibull psychometric function:

    // p2=delta*gamma+(1-delta)*(1-(1-gamma)*exp(-10.^(beta*(x-xThreshold))));

    // where x represents log10 contrast relative to threshold. 

    // The Weibull function itself appears only in QuestRecompute, which uses the specified parameter values in q 
    // to compute a psychometric function and store it in q. 

    // All the other Quest functions simply use the psychometric function stored in "q". 
    // QuestRecompute is called solely by QuestCreate and QuestBetaAnalysis (and possibly by a few user programs). 
    // Thus, if you prefer to use a different kind of psychometric function, called Foo, 
    // you need only create your own QuestCreateFoo, QuestRecomputeFoo, and (if you need it)
    // QuestBetaAnalysisFoo, based on QuestCreate, QuestRecompute, and QuestBetaAnalysis, and you can use them 
    // with the rest of the Quest package unchanged. 
    // You would only be changing a few lines of code, so it would quite easy to do.

    // Several users of Quest have asked questions on the Psychtoolbox forum about how to restrict themselves to 
    // a practical testing range. 
    // That is not what tGuessSd and "range" are for; they should be large, e.g. I typically set tGuessSd=3 and range=5 
    // when intensity represents log contrast. 
    // If necessary, you should restrict the range yourself, outside of Quest. 
    // Here, in QuestCreate, you tell Quest about your prior beliefs, and you should try to be open-minded, 
    // giving Quest a generously large range to consider as possible values of threshold. 
    // For each trial you will later ask Quest to suggest a test intensity. 
    // It is important to realize that what Quest returns is just what you asked for, a suggestion. 
    // You should then test at whatever intensity you like, taking into account both the suggestion and any practical constraints
    //  (e.g. a maximum and minimum contrast that you can achieve, and quantization of contrast). 
    // After running the trial you should call QuestUpdate with the contrast that you actually used 
    // and the observer's response to add your new datum to the database. 
    // Don't restrict "tGuessSd" or "range" by the limitations of what you can display. 
    // Keep open the possibility that threshold may lie outside the range of contrasts that you can produce, 
    // and let Quest consider all possibilities.

    // There is one exception to the above advice of always being generous with tGuessSd. 
    // Occasionally we find that we have a working Quest-based program that measures threshold, 
    // and we discover that we need to measure the proportion correct at a particular intensity. 
    // Instead of writing a new program, or modifying the old one, it is often more convenient 
    // to instead reduce tGuessSd to practically zero, e.g. a value like 0.001, which has the effect of restricting all threshold 
    // estimates to be practically identical to tGuess, making it easy to run any number of trials at that intensity. 
    // Of course, in this case, the final threshold estimate from Quest should be ignored, since it is merely parroting back to you 
    // the assertion that threshold is equal to the initial guess "tGuess". 
    // What's of interest is the final proportion correct; at the end, call QuestTrials or add an FPRINTF statement to report it.

    // tGuess is your prior threshold estimate.
    // tGuessSd is the standard deviation you assign to that guess. Be generous. 

    // pThreshold is your threshold criterion expressed as probability of response==1. 
    // An intensity offset is introduced into the psychometric function so that threshold (i.e. the midpoint of the table) yields pThreshold.

    // beta, delta, and gamma are the parameters of a Weibull psychometric function.
    // beta controls the steepness of the psychometric function. Typically 3.5.
    // delta is the fraction of trials on which the observer presses blindly. Typically 0.01.
    // gamma is the fraction of trials that will generate response 1 when intensity==-inf.

    // grain is the quantization (step size) of the internal table. E.g. 0.01.
    // range is the intensity difference between the largest and smallest intensity that the internal table can store. E.g. 5. 
    // This interval will be centered on the initial guess tGuess, i.e. tGuess+(-range/2:grain:range/2). 
    // "range" is used only momentarily here, to determine "dim", which is retained in the quest struct. 
    // "dim" is the number of distinct intensities that the internal table can store, e.g. 500. 
    // QUEST assumes that intensities outside of this interval have zero prior probability, i.e. they are impossible values for threshold. 

    // The cost of making "range" too big is some extra storage and computation, which are usually negligible. 
    // The cost of making "range" too small is that you prejudicially exclude what are actually possible values for threshold. 
    // Getting out-of-range warnings from QuestUpdate is one possible indication that your stated range is too small.

    // % Copyright (c) 1996-2004 Denis Pelli

    let q = {};

    if (typeof tGuess === 'undefined') {
        alert('Please specify tGuess as a parameter of QuestCreate.'); 
        return
    } else {
        q.tGuess = tGuess;
    }
    
    if (typeof tGuessSd === 'undefined') {
        alert('Please specify tGuessSd as a parameter of QuestCreate.'); 
        return
    } else {
        q.tGuessSd = tGuessSd;
    }

    if (typeof pThreshold === 'undefined') {
        alert('Please specify pThreshold as a parameter of QuestCreate.'); 
        return
    } else {
        q.pThreshold = pThreshold;
    }

    if (typeof beta === 'undefined') {
        alert('Please specify beta as a parameter of QuestCreate.'); 
        return
    } else {
        q.beta = beta;
    }

    if (typeof delta === 'undefined') {
        alert('Please specify delta as a parameter of QuestCreate.'); 
        return
    } else {
        q.delta = delta;
    }

    if (typeof gamma === 'undefined') {
        alert('Please specify gamma as a parameter of QuestCreate.'); 
        return
    } else {
        q.gamma = gamma;
    }

    // if nargin < 7 || isempty(grain)
    //     grain=0.01;
    // end
    if (typeof grain === 'undefined') {
        q.grain = 0.01;
    } else {
        q.grain = grain;
    }

    // if nargin < 8 || isempty(range)
    //     dim=500;
    // else
    //     if range<=0
    //         error('"range" must be greater than zero.')
    //     end
    //     dim=range/grain;
    //     dim=2*ceil(dim/2);	% round up to an even integer
    // end
    let dim = 500;
    if (typeof range !== 'undefined') {
        if (range <= 0) {
            alert('The range parameter must be greater than zero.');
            return
        }
        dim = range/grain;
        dim = 2 * Math.ceil(dim/2);	// round up to an even integer
    }

    // if nargin < 9 || isempty(plotIt)
    //     plotIt = 0;
    // end
    if (typeof plotIt === 'undefined') {
        plotIt = 0;
    } 

    // pending
    // if ~isfinite(tGuess) || ~isreal(tGuess)
    //     error('"tGuess" must be real and finite.');
    // end
    // JavaScript does not have a isreal function.
    if (!numeric.isFinite(tGuess)){
        alert('The tGuess parameter must be finite.');
    }

    // q.updatePdf=1; % boolean: 0 for no, 1 for yes
    q.updatePdf = 1;
    q.warnPdf = 1; // boolean
    q.normalizePdf = 1; // boolean. This adds a few ms per call to QuestUpdate, but otherwise the pdf will underflow after about 1000 trials.
    q.dim = dim;

    return QuestRecompute(q, plotIt);
    // return QuestRecompute(q, 1, 400, 300);
    
}
 
function diff(my_array){
    const differences = [];
    my_array.forEach((element, index, array) => {
      if (index < my_array.length - 1){
          differences.push(array[index+1] - element);
      }
    });
    return differences
}

function find_non_zero_index(my_array){
    const indices = [];
    my_array.forEach((element, index) => {
      if (element !== 0){
          indices.push(index);
      }
    });
    return indices
}

function find_more_than_zero_index(my_array){
    const indices = [];
    my_array.forEach((element, index) => {
      if (element > 0){
          indices.push(index);
      }
    });
    return indices
}

function find_less_than_or_equal_to_zero_index(my_array){
    const indices = [];
    my_array.forEach((element, index) => {
      if (element <= 0){
          indices.push(index);
      }
    });
    return indices
}

function get_array_using_index(array, indices){
    const values = [];
    indices.forEach(element => {
      values.push(array[element]);
    });
    return values
}

function fliplr(array){
    const result = [];
        array.forEach((element, index, array) => {
            result.push(array[array.length-1-index]);
        });
    return result
}

function max_of_array(arr){
    return arr.reduce(function(a, b) {
        return Math.max(a, b);
    });
}

function min_of_array(arr){
    return arr.reduce(function(a, b) {
        return Math.min(a, b);
    });
}

let recompute_chart, recompute_chart2;

function QuestRecompute(q, plotIt, chart_width, chart_height){
    // q=QuestRecompute(q [,plotIt=0])

    // Call this immediately after changing a parameter of the psychometric function. 
    // QuestRecompute uses the specified parameters in "q" to recompute the psychometric function. 
    // It then uses the newly computed psychometric function and the history in q.intensity and q.response to recompute the pdf. 
    // (QuestRecompute does nothing if q.updatePdf is false.)

    // QuestCreate saves in struct q the parameters for a Weibull psychometric function:

    // p2=delta*gamma+(1-delta)*(1-(1-gamma)*exp(-10.^(beta*(x-xThreshold))));

    // where x represents log10 contrast relative to threshold. 
    // The Weibull function itself appears only in QuestRecompute, which uses the specified parameter values in q 
    // to compute a psychometric function and store it in q. 
    // All the other Quest functions simply use the psychometric function stored in "q". 
    // QuestRecompute is called solely by QuestCreate and QuestBetaAnalysis (and possibly by a few user programs). 
    // Thus, if you prefer to use a different kind of psychometric function, called Foo, you need only create your own 
    // QuestCreateFoo, QuestRecomputeFoo, and (if you need it) QuestBetaAnalysisFoo, based on QuestCreate, QuestRecompute, 
    // and QuestBetaAnalysis, and you can use them with the rest of the Quest package unchanged. 
    // You would only be changing a few lines of code, so it would quite easy to do.

    // "dim" is the number of distinct intensities that the internal tables in q can store, e.g. 500. 
    // This vector, of length "dim", with increment size "grain", will be centered on the initial guess tGuess, 
    // i.e. tGuess+[-range/2:grain:range/2]. 
    // QUEST assumes that intensities outside of this interval have zero prior probability, i.e. they are impossible values for threshold. 
    // The cost of making "dim" too big is some extra storage and computation, which are usually negligible. 
    // The cost of making "dim" too small is that you prejudicially exclude what are actually possible values for threshold. 
    // Getting out-of-range warnings from QuestUpdate is one possible indication that your stated range is too small.

    // If you set the optional parameter 'plotIt' to 1, the function will plot the psychometric function in use.

    // See QuestCreate, QuestUpdate, QuestQuantile, QuestMean, QuestMode, QuestSd, and QuestSimulate.

    // % Copyright (c) 1996-2004 Denis Pelli

    // if length(q)>1
    // 	for i=1:length(q(:))
    // 		q(i).normalizePdf=0; % any norming must be done across the whole set of pdfs, because it's actually one big multi-dimensional pdf.
    // 		q(i)=QuestRecompute(q(i));
    // 	end
    // 	return
    // end
    if (Array.isArray(q) && q.length > 1){
    	for (let i = 0; i < q.length; i++){
    		q[i].normalizePdf=0; // % any norming must be done across the whole set of pdfs, because it's actually one big multi-dimensional pdf.
    		q[i] = QuestRecompute(q[i]);
        }
    	return q
    }

    // if ~q.updatePdf
    // 	return
    // end
    if (!q.updatePdf) return q

    // if q.gamma>q.pThreshold
    //     warning(sprintf('reducing gamma from %.2f to 0.5',q.gamma)) %#ok<SPWRN>
    //     q.gamma=0.5;
    // end
    if (q.gamma > q.pThreshold){
        alert(`reducing gamma from ${q.gamma} to 0.5`);
        q.gamma = 0.5;
    }

    // % Don't visualize functions by default:
    // if nargin < 2 || isempty(plotIt)
    //     plotIt = 0;
    // end
    if (typeof plotIt === 'undefined') plotIt = 0;

    // % prepare all the arrays

    // q.i=-q.dim/2:q.dim/2;
    q.i = numeric.linspace(-q.dim/2, q.dim/2);

    // q.x=q.i*q.grain;
    q.x = numeric.mul(q.i, q.grain);

    // q.pdf=exp(-0.5*(q.x/q.tGuessSd).^2);
    function calc_pdf(){
        const tmp1 = numeric.div(q.x, q.tGuessSd);
        const tmp2 = numeric.pow(tmp1, 2);
        const tmp3 = numeric.mul(-0.5, tmp2);
        return numeric.exp(tmp3)
    }
    q.pdf = calc_pdf();
    
    // q.pdf=q.pdf/sum(q.pdf);
    q.pdf = numeric.div(q.pdf, numeric.sum(q.pdf));

    // i2=-q.dim:q.dim;
    const i2 = numeric.linspace(-q.dim, q.dim);

    // q.x2=i2*q.grain;
    q.x2 = numeric.mul(i2, q.grain);
        
    // q.p2 = q.delta*q.gamma+(1-q.delta)*(1-(1-q.gamma)*exp(-10.^(q.beta*q.x2)));
    function calc_p2(x){
        const tmp1 = numeric.mul(q.delta, q.gamma);
        const tmp2 = numeric.sub(1, q.delta);
        const tmp3 = numeric.sub(1, q.gamma);
        const tmp4 = numeric.mul(q.beta, x);
        const tmp5 = numeric.pow(10, tmp4);
        const tmp6 = numeric.exp(numeric.mul(-1, tmp5));
        const tmp7 = numeric.sub(1, numeric.mul(tmp3, tmp6));
        return numeric.add(tmp1, numeric.mul(tmp2, tmp7))
    }
    q.p2 = calc_p2(q.x2);

    // % Plot Psychometric function if requested:
    // if plotIt > 0
    //     figure;
    //     plot(q.x2, q.p2);
    // end
    // 
    if (plotIt > 0){
        // Chart.js: https://www.chartjs.org/
        if (document.getElementById('recompute_canvas') === null) {
            const canvas_element = document.createElement('canvas');
            canvas_element.id = 'recompute_canvas';
            if (typeof chart_width === 'undefined') {
                canvas_element.width = 800;
             } else {
                canvas_element.width = chart_width;
             } 
            if (typeof chart_height === 'undefined') {
                canvas_element.height = 600;
             } else {
                 canvas_element.height = chart_height;
             }
            document.body.appendChild(canvas_element);
        } 

        const ctx = document.getElementById('recompute_canvas').getContext('2d');
        const weibull = [];
        for (let i = 0; i < q.x2.length; i++){
            weibull.push({
                x: q.x2[i],
                y: q.p2[i]
            });
        }

        if (typeof recompute_chart !== 'undefined') {
            recompute_chart.destroy();
        }

        // recompute_chart must be a global variable, that is, 'const' or 'let' shuld not be used.
        recompute_chart = new Chart(ctx, {
            type: 'scatter',
            data: {
                datasets: [
                    {
                        label: 'Psychometric function',
                        data: weibull,
                        backgroundColor: 'RGBA(225,95,150, 1)',
                    },
                ]
            },
            options: {
                title: {
                    display: true,
                    text: 'Psychometric function by QuestRecompute.'
                },
                scales: {
                    xAxes: [
                        {
                            scaleLabel: {
                                display: true,
                                labelString: 'Stimulus intensity (Log scale)'
                            }
                        }
                    ],
                    yAxes: [
                        {
                            scaleLabel: {
                                display: true,
                                labelString: 'Probability'
                            }
                        }
                    ]
                },
                responsive: false
            }
        });
    }

    // if min(q.p2([1 end]))>q.pThreshold || max(q.p2([1 end]))<q.pThreshold
    //     error(sprintf('psychometric function range [%.2f %.2f] omits %.2f threshold',min(q.p2),max(q.p2),q.pThreshold))
    // end
    if (min_of_array(q.p2) > q.pThreshold || max_of_array(q.p2) < q.pThreshold){
        alert(`psychometric function range [${min_of_array(q.p2)} ${max_of_array(q.p2)}] omits ${q.pThreshold} threshold`);
    }

    // if any(~isfinite(q.p2))
    //     error('psychometric function p2 is not finite')
    // end
    if (numeric.isFinite(q.p2).includes(false)){
        alert('psychometric function p2 is not finite');
    }

    // index=find(diff(q.p2)); 		% subset that is strictly monotonic
    // if length(index)<2
    //     error(sprintf('psychometric function has only %g strictly monotonic point(s)',length(index)))
    // end
    const index = find_non_zero_index(diff(q.p2));
    if (index.length < 2) {
        alert(`psychometric function has only ${index.length} strictly monotonic point(s)`);
    }

    // q.xThreshold=interp1(q.p2(index),q.x2(index),q.pThreshold);
    // if ~isfinite(q.xThreshold)
    //     q %#ok<NOPRT>
    //     error(sprintf('psychometric function has no %.2f threshold',q.pThreshold))
    // end
    const p3 = get_array_using_index(q.p2, index);
    const x3 = get_array_using_index(q.x2, index);
    // q.xThreshold = numeric.spline(p3, x3).at(q.pThreshold) // Bug?
    q.xThreshold = interp1(p3, x3, [q.pThreshold])[0];
    if (numeric.isFinite(q.xThreshold) === false){
        alert(`psychometric function has no ${q.pThreshold} threshold`);
    }

    // If you want to see the scatter plot of x3 and p3, please specify the plotIt as 2.
    if (plotIt === 2){
        // Chart.js: https://www.chartjs.org/
        if (document.getElementById('recompute_canvas2') === null) {
            const canvas_element = document.createElement('canvas');
            canvas_element.id = 'recompute_canvas2';
            if (typeof chart_width === 'undefined') {
                canvas_element.width = 800;
             } else {
                canvas_element.width = chart_width;
             } 
            if (typeof chart_height === 'undefined') {
                canvas_element.height = 600;
             } else {
                 canvas_element.height = chart_height;
             }
            document.body.appendChild(canvas_element);
        } 

        const ctx = document.getElementById('recompute_canvas2').getContext('2d');
        const weibull = [];
        for (let i = 0; i < q.x2.length; i++){
            weibull.push({
                x: x3[i],
                y: p3[i]
            });
        }

        if (typeof recompute_chart2 !== 'undefined') {
            recompute_chart2.destroy();
        }

        // recompute_chart2 must be a global variable, that is, 'const' or 'let' shuld not be used.
        recompute_chart2 = new Chart(ctx, {
            type: 'scatter',
            data: {
                datasets: [
                    {
                        label: 'Psychometric function',
                        data: weibull,
                        backgroundColor: 'RGBA(225,95,150, 1)',
                    },
                ]
            },
            options: {
                title: {
                    display: true,
                    text: 'Psychometric function by QuestRecompute.'
                },
                scales: {
                    xAxes: [
                        {
                            scaleLabel: {
                                display: true,
                                labelString: 'Stimulus intensity (Log scale)'
                            }
                        }
                    ],
                    yAxes: [
                        {
                            scaleLabel: {
                                display: true,
                                labelString: 'Probability'
                            }
                        }
                    ]
                },
                responsive: false
            }
        });
    }

    // q.p2=q.delta*q.gamma+(1-q.delta)*(1-(1-q.gamma)*exp(-10.^(q.beta*(q.x2+q.xThreshold))));
    // if any(~isfinite(q.p2))
    //     q %#ok<NOPRT>
    //     error('psychometric function p2 is not finite')
    // end
    q.p2 = calc_p2(numeric.add(q.x2, q.xThreshold));
    if (numeric.isFinite(q.p2).includes(false)){
        alert('psychometric function p2 is not finite');
    }

    // q.s2=fliplr([1-q.p2;q.p2]);
    q.s2 = [fliplr(numeric.sub(1, q.p2)), fliplr(q.p2)];

    // if ~isfield(q,'intensity') || ~isfield(q,'response')
    //     Preallocate for 10000 trials, keep track of real useful content in q.trialCount. 
    //     We allocate such large chunks to reduce memory fragmentation that would be caused by growing the arrays one element per trial. 
    //     Fragmentation has been shown to cause severe out-of-memory problems if one runs many interleaved quests. 
    //     10000 trials require/waste about 157 kB of memory, which is basically nothing for today's computers and likely suffices for even the most tortuous experiment.

    //     q.trialCount = 0;
    //     q.intensity=zeros(1,10000);
    //     q.response=zeros(1,10000);
    // end
    if (typeof q.intensity === 'undefined' || typeof q.response === 'undefined'){
        q.trialCount = 0;
        q.intensity = numeric.rep([10000], 0);
        q.response = numeric.rep([10000], 0);
    }
    
    // if any(~isfinite(q.s2(:)))
    //     error('psychometric function s2 is not finite')
    // end
    const isfinite_q_s2 = numeric.isFinite(q.s2); // Note that q.s2 is an array of array.
    if (isfinite_q_s2[0].includes(false) || isfinite_q_s2[1].includes(false)){
        alert('psychometric function s2 is not finite');
    }


    // % Best quantileOrder depends only on min and max of psychometric function.
    // % For 2-interval forced choice, if pL=0.5 and pH=1 then best quantileOrder=0.60
    // % We write x*log(x+eps) in place of x*log(x) to get zero instead of NaN when x is zero.
    // pL=q.p2(1);
    // pH=q.p2(end);
    // pE=pH*log(pH+eps)-pL*log(pL+eps)+(1-pH+eps)*log(1-pH+eps)-(1-pL+eps)*log(1-pL+eps);
    // pE=1/(1+exp(pE/(pL-pH)));
    // q.quantileOrder=(pE-pL)/(pH-pL);
    const pL = q.p2[0];
    const pH = q.p2[q.p2.length-1];
    const eps = 2.2204 * Math.pow(10, -16);
    const pre_pE = pH * Math.log(pH + eps) - pL * Math.log(pL + eps) + (1 - pH + eps) * Math.log(1 - pH + eps) - (1 - pL + eps) * Math.log(1 - pL + eps);
    const pE = 1 / (1 + Math.exp(pre_pE / (pL - pH)));
    q.quantileOrder = (pE - pL) / (pH - pL);

    // if any(~isfinite(q.pdf))
    //     error('prior pdf is not finite')
    // end
    if (numeric.isFinite(q.pdf).includes(false)){
        alert('prior pdf is not finite');
    }

    // % recompute the pdf from the historical record of trials
    // for k=1:q.trialCount
    //     inten=max(-1e10,min(1e10,q.intensity(k))); % make intensity finite
    //     ii=length(q.pdf)+q.i-round((inten-q.tGuess)/q.grain);
    //     if ii(1)<1
    //         ii=ii+1-ii(1);
    //     end
    //     if ii(end)>size(q.s2,2)
    //         ii=ii+size(q.s2,2)-ii(end);
    //     end
    //     q.pdf=q.pdf.*q.s2(q.response(k)+1,ii); % 4 ms
    //     if q.normalizePdf && mod(k,100)==0
    //         q.pdf=q.pdf/sum(q.pdf);	% avoid underflow; keep the pdf normalized	% 3 ms
    //     end
    // end
    const large_num = Math.pow(10, 10);
    for (let k = 0; k < q.trialCount; k++){
        const inten = Math.max(-1*large_num, Math.min(large_num, q.intensity[k])); // make intensity finite
        const tmp = Math.round((inten - q.tGuess) / q.grain);
        let ii = numeric.sub(numeric.add(q.pdf.length, q.i), tmp);
        const tmp2 = ii[0];
        if (tmp2 < 0){ // 'ii' must be greater than or equal to zero because 'ii' is the index of an array in JavaScript.
            ii = numeric.sub(ii, tmp2); 
        }
        const tmp3 = ii[ii.length-1];
        const tmp4 = numeric.dim(q.s2)[1]-1;
        if (tmp3 > tmp4){ // Also, 'ii' must not be greater than the size of an array minus one.
            ii = numeric.sub(numeric.add(ii, tmp4), tmp3);
        }

        // q.pdf = numeric.mul(q.pdf, q.s2[q.response(k)+1, ii]) // 4 ms
        q.pdf = numeric.mul(q.pdf, get_array_using_index(q.s2[q.response[k]], ii));

        if (q.normalizePdf && (k+1) % 100 === 0){
		    q.pdf = numeric.div(q.pdf, numeric.sum(q.pdf));	// % avoid underflow; keep the pdf normalized	% 3 ms
        }
    }

    // if q.normalizePdf
    //     q.pdf=q.pdf/sum(q.pdf);		% keep the pdf normalized	% 3 ms
    // end
    if (q.normalizePdf === 1){
        q.pdf = numeric.div(q.pdf, numeric.sum(q.pdf));		// % keep the pdf normalized	% 3 ms
    }

    // if any(~isfinite(q.pdf))
    //     error('pdf is not finite')
    // end
    if (numeric.isFinite(q.pdf).includes(false)){
        alert('pdf is not finite');
    }

    return q
}

function cumsum(array){
    const result = [];
    for (let i = 0; i < array.length; i++){
      if (i === 0){
        result.push(array[0]);
      } else {
        result.push(result[i-1] + array[i]);
      }
    }
    return result
}

function QuestQuantile(q,quantileOrder){
    // intensity=QuestQuantile(q,[quantileOrder])
    
    // Gets a quantile of the pdf in the struct q. You may specify the desired quantileOrder, e.g. 0.5 for median, 
    // or, making two calls, 0.05 and 0.95 for a 90confidence interval. 
    // If the "quantileOrder" argument is not supplied, then it's taken from the "q" struct. 
    // QuestCreate uses QuestRecompute to compute the optimal quantileOrder and saves that in the "q" struct;
    // this quantileOrder yields a quantile that is the most informative intensity for the next trial.

    // This is based on work presented at a conference, but otherwise unpublished: Pelli, D. G. (1987). 
    // The ideal psychometric procedure. Investigative Ophthalmology & Visual Science, 28(Suppl), 366.

    // See Quest.

    // % Copyright (c) 1996-2015 Denis Pelli

    // if nargin>2
    //     error('Usage: intensity=QuestQuantile(q,[quantileOrder])')
    // end
    if (typeof q === 'undefined') alert('Usage: intensity=QuestQuantile(q,[quantileOrder])');

    // if length(q)>1
    //     if nargin>1
    //         error('Cannot accept quantileOrder for q vector. Set each q.quantileOrder instead.')
    //     end
    //     t=zeros(size(q));
    //     for i=1:length(q(:))
    //         t(i)=QuestQuantile(q(i));
    //     end
    //     return
    // end
    if (Array.isArray(q) && q.length > 1){
        if (typeof quantileOrder !== 'undefined') alert('Cannot accept quantileOrder for q vector. Set each q.quantileOrder instead.');

        const t = numeric.rep([q.length], 0);
        for (let i = 0; i < q.length; i++){
            t[i] = QuestQuantile(q[i]);
        }
        return t
    }

    // if nargin<2
    //     quantileOrder=q.quantileOrder;
    // end
    if (typeof quantileOrder === 'undefined' ) quantileOrder = q.quantileOrder;

    // if quantileOrder > 1 || quantileOrder < 0
    //     error('quantileOrder %f is outside range 0 to 1.',quantileOrder);
    // end
    if (quantileOrder > 1 || quantileOrder < 0){
        alert(`quantileOrder ${quantileOrder} is outside range 0 to 1.`);
    }

    const p = cumsum(q.pdf);
    // if ~isfinite(p(end))
    //     error('pdf is not finite')
    // end
    if (!isFinite(p[p.length-1])){
        alert('pdf is not finite');
    }

    // if p(end)==0
    //     error('pdf is all zero')
    // end
    if (p[p.length-1] === 0){
        alert('pdf is all zero');
    }

    // if quantileOrder < p(1)
    //     t=q.tGuess+q.x(1);
    //     return
    // end
    if (quantileOrder < p[0]){
        const t = q.tGuess + q.x[0];
        return t
    }

    // if quantileOrder > p(end)
    //     t=q.tGuess+q.x(end);
    //     return
    // end
    if (quantileOrder > p[p.length-1]){
        const t = q.tGuess + q.x[q.x.length - 1];
        return t
    }

    // index=find(diff([-1 p])>0);
    const index = find_more_than_zero_index(diff([-1].concat(p)));

    // if length(index)<2
    //     error('pdf has only %g nonzero point(s)',length(index));
    // end
    if (index.length < 2){
        alert(`pdf has only ${index.length} nonzero point(s)`);
    }

    // t=q.tGuess+interp1(p(index),q.x(index),quantileOrder*p(end)); % 40 ms
    const p2 = get_array_using_index(p, index);
    const x2 = get_array_using_index(q.x, index);
    // t = q.tGuess + numeric.spline(p2, x2).at(quantileOrder * p[p.length-1])
    const t = q.tGuess + interp1(p2, x2, [quantileOrder * p[p.length-1]])[0];

    return t
}

// return a array of numbers larger than num
function get_larger_numbers(array, num){
    const result = [];
    array.forEach(x => {
        if (x >= num){
            result.push(x);
        } else {
            result.push(num);
        }
    });
    return result
}

function get_smaller_numbers(array, num){
    const result = [];
    array.forEach(x => {
        if (x <= num){
            result.push(x);
        } else {
            result.push(num);
        }
    });
    return result
}

let simulate_chart;

function QuestSimulate(q,tTest,tActual,plotIt, chart_width, chart_height){
    // % response=QuestSimulate(q,intensity,tActual [,plotIt])
    //
    // Simulate the response of an observer with threshold tActual when exposed to a stimulus tTest.
    // 
    // 'plotIt' is optional: If set to a non-zero value, the simulated Quest session is visualized in a plot which shows the psychometric function of the simulated observer, where Quest placed test trials and what the observers response was. 
    // plotIt == 1 shows past trials in black, the current trial in green or red for a positive or negative response. 
    // plotIt == 2 color-codes all trials in red/green for negative or positive responses. 
    // By default, nothing is plotted.

    // % Copyright (c) 1996-2018 Denis Pelli

    // if nargin < 3
    //     error('Usage: response=QuestSimulate(q,tTest,tActual[,plotIt])')
    // end
    if (typeof q === 'undefined' || typeof tTest === 'undefined' || typeof tActual === 'undefined'){
        alert('Usage: response=QuestSimulate(q,tTest,tActual[,plotIt])');
    }

    // if length(q)>1
    //     error('can''t deal with q being a vector')
    // end
    if (Array.isArray(q) && q.length > 1) alert('can not deal with q being a vector');

    // x2min=min(q.x2([1 end]));
    // x2max=max(q.x2([1 end]));
    // t=min(max(tTest-tActual,x2min),x2max);
    const x2min = min_of_array(q.x2);
    const x2max = max_of_array(q.x2);
    const t = Math.min(Math.max(tTest-tActual, x2min), x2max); // scalar

    // response=interp1(q.x2,q.p2,t) > rand(1);
    const flag = interp1(q.x2, q.p2, [t])[0] > Math.random(); // true or false
    const response = flag? 1:0;

    // % Visualize if requested:
    // if (nargin >= 4) && (plotIt > 0)
    if (typeof plotIt !== 'undefined' && plotIt > 0){
        // tc = t;
        // col = {'*r', '*g'};
        const tc = t;
        const col = ['RGBA(255, 0, 0, 1)', 'RGBA(0, 128, 0, 1)'];

        // t = min(max(q.intensity(1:q.trialCount) - tActual, x2min), x2max);
        const tmp = numeric.sub(q.intensity.slice(0, q.trialCount), tActual);
        // Changed the name of the variable from t to t2 to avoid confusion
        const t2 = get_smaller_numbers(get_larger_numbers(tmp, x2min), x2max);
        
        // if plotIt == 2
        //     positive = find(q.response(1:q.trialCount) > 0);
        //     negative = find(q.response(1:q.trialCount) <= 0);
        //     pcol = 'og';
        // else
        //     positive = 1:q.trialCount;
        //     negative = [];
        //     pcol = 'ok';
        // end
        let positive, negative, pcol;
        if (plotIt === 2){
            positive = find_more_than_zero_index(q.response.slice(0, q.trialCount));
            negative = find_less_than_or_equal_to_zero_index(q.response.slice(0, q.trialCount));
            pcol = 'RGBA(0, 128, 0, 1)';
        } else {
            positive = numeric.linspace(0, q.trialCount-1);
            negative = [];
            pcol = 'RGBA(0, 0, 0, 1)';
        }
        
        // plot(q.x2 + tActual, q.p2, 'b', ...
        //     t(positive) + tActual, interp1(q.x2,q.p2,t(positive)), pcol, ...
        //     t(negative) + tActual, interp1(q.x2,q.p2,t(negative)), 'or', ...
        //     tActual, interp1(q.x2 + tActual,q.p2,tActual), 'x', ...
        //     tc + tActual, interp1(q.x2,q.p2,tc), col{response + 1});
   
        // Chart.js: https://www.chartjs.org/
        if (document.getElementById('simulate_canvas') === null) {
            const canvas_element = document.createElement('canvas');
            canvas_element.id = 'simulate_canvas';
            if (typeof chart_width === 'undefined') {
                canvas_element.width = 800;
            } else {
                canvas_element.width = chart_width;
            } 
            if (typeof chart_height === 'undefined') {
                canvas_element.height = 600;
            } else {
                canvas_element.height = chart_height;
            }
            document.body.appendChild(canvas_element);
        } 

        const ctx = document.getElementById('simulate_canvas').getContext('2d');
        const weibull = [];
        for (let i = 0; i < q.x2.length; i++){
            weibull.push({
                x: q.x2[i] + tActual,
                y: q.p2[i]
            });
        }

        const graph_data = [];
        graph_data.push({
            label: 'Psychometric function',
            data: weibull,
            backgroundColor: 'RGBA(225,95,150, 1)',
        });

        const positive_data = [];
        const positive_x = get_array_using_index(t2, positive);
        for (let i = 0; i < positive.length; i++){
            positive_data.push({
                x: positive_x[i] + tActual,
                // y: numeric.spline(q.x2, q.p2).at(positive_x[i])
                y: interp1(q.x2, q.p2, [positive_x[i]])[0] 
            });
        }

        const negative_data = [];
        if (plotIt === 2){
            const negative_x = get_array_using_index(t2, negative);
            for (let i = 0; i < negative.length; i++){
                negative_data.push({
                    x: negative_x[i] + tActual,
                    // y: numeric.spline(q.x2, q.p2).at(negative_x[i])
                    y: interp1(q.x2, q.p2, [negative_x[i]])[0] 
                });
            }

            graph_data.push({
                label: 'Positive',
                data: positive_data,
                backgroundColor: pcol,
                pointBorderColor: pcol,
                pointStyle: 'star',
                pointBorderWidth: 2,
                pointRadius: 10,
                pointRotation: 45,
            });

            graph_data.push({
                label: 'Negative',
                data: negative_data,
                backgroundColor: 'RGBA(255, 0, 0, 1)',
                pointBorderColor: 'RGBA(255, 0, 0, 1)',
                pointStyle: 'star',
                pointBorderWidth: 2,
                pointRadius: 10,
                pointRotation: 45,
            });
        } else {
            graph_data.push({
                label: 'Responses',
                data: positive_data,
                backgroundColor: pcol,
                pointBorderColor: pcol,
                pointStyle: 'star',
                pointBorderWidth: 2,
                pointRadius: 10,
                pointRotation: 45,
            });
        }

        graph_data.push({
            label: 'tActual',
            data: [{
                x: tActual, 
                // y: numeric.spline(numeric.add(q.x2, tActual) , q.p2).at(tActual)
                y: interp1(numeric.add(q.x2, tActual), q.p2, [tActual])[0] 
            }],
            backgroundColor: 'RGBA(255, 0, 255, 1)',
            pointBorderColor: 'RGBA(255, 0, 255, 1)',
            pointStyle: 'circle',
            pointBorderWidth: 2,
            pointRadius: 10,
            pointRotation: 45,
        },
        {
            label: 'The latest repsonse (Circle)',
            data: [{
                x: tc + tActual, 
                y: interp1(q.x2, q.p2, [tc])[0] 
            }],
            backgroundColor: col[response],
            pointBorderColor: col[response],
            pointStyle: 'circle',
            // pointBorderWidth: 2,
            pointRadius: 10,
            // pointRotation: 45,
        });

        if (typeof simulate_chart !== 'undefined') {
            simulate_chart.destroy();
        }

        // simulate_chart must be a global variable, that is, 'const' or 'let' shuld not be used.
        simulate_chart = new Chart(ctx, {
            type: 'scatter',
            data: {
                datasets: graph_data
            },
            options: {
                title: {
                    display: true,
                    text: 'Psychometric function by QuestSimulate.'
                },
                scales: {
                    xAxes: [
                        {
                            scaleLabel: {
                                display: true,
                                labelString: 'Stimulus intensity (Log scale)'
                            }
                        }
                    ],
                    yAxes: [
                        {
                            scaleLabel: {
                                display: true,
                                labelString: 'Probability'
                            }
                        }
                    ]
                },
                responsive: false
            }
        });        
    }
    return response
}

function QuestUpdate(q, intensity, response){
    // % q=QuestUpdate(q,intensity,response)

    // Update the struct q to reflect the results of this trial. 
    // The historical records q.intensity and q.response are always updated, but q.pdf is only updated if q.updatePdf is true. 
    // You can always call QuestRecompute to recreate q.pdf from scratch from the historical record.

    // if nargin~=3
    //     error('Usage: q=QuestUpdate(q,intensity,response)')
    // end
    if (typeof q === 'undefined' || typeof intensity === 'undefined' || typeof response === 'undefined'){
        alert('Usage: q=QuestUpdate(q,intensity,response)');    
    }

    // if length(q)>1
    //     error('Can''t deal with q being a vector.')
    // end
    if (Array.isArray(q) && q.length > 1) alert('Can not deal with q being a vector.');

    // pending
    // JavaScript does not have a isreal function.
    // if ~isreal(intensity)
    //     error(sprintf('QuestUpdate: intensity %s must be real, not complex.',num2str(intensity)));
    // end

    // if response<0 || response>=size(q.s2,1)
    //     error(sprintf('response %g out of range 0 to %d',response,size(q.s2,1)-1))
    // end
    if (response < 0 || response > q.s2.length-1){
        alert(`response ${response} out of range 0 to ${q.s2.length-1}`);
    }


    if (q.updatePdf){
        // inten=max(-1e10,min(1e10,intensity)); % make intensity finite
        const large_num = Math.pow(10, 10);
        const inten = Math.max(-1*large_num, Math.min(large_num, intensity)); // make intensity finite
            
        // ii=size(q.pdf,2)+q.i-round((inten-q.tGuess)/q.grain);
        const tmp = q.pdf.length - Math.round((inten - q.tGuess)/q.grain);
        let ii = numeric.add(tmp, q.i);

        // if ii(1)<1 || ii(end)>size(q.s2,2)
        // 'ii' must be greater than or equal to zero because 'ii' is the index of an array in JavaScript.
        // Also, 'ii' must not be greater than the size of an array minus one. 
        if (ii[0] < 0 || ii[ii.length-1] > numeric.dim(q.s2)[1]-1){
            if (q.warnPdf){
                // low=(1-size(q.pdf,2)-q.i(1))*q.grain+q.tGuess;
                // high=(size(q.s2,2)-size(q.pdf,2)-q.i(end))*q.grain+q.tGuess;
                const low = (1 - q.pdf.length - q.i[0]) * q.grain + q.tGuess;
                const high = (numeric.dim(q.s2)[1] - q.pdf.length - q.i[q.i.length-1]) * q.grain + q.tGuess;
                        
                alert(`QuestUpdate: intensity ${intensity} out of range ${low} to ${high}. Pdf will be inexact. Suggest that you increase "range" in call to QuestCreate.`);
                // pending
                // oldWarning=warning;
                // warning('on'); %#ok<WNON> % no backtrace
                // warning(sprintf('QuestUpdate: intensity %.3f out of range %.2f to %.2f. Pdf will be inexact. Suggest that you increase "range" in call to QuestCreate.',intensity,low,high)); %#ok<SPWRN>
                // warning(oldWarning);
            }
            // if ii(1)<1
            // 	ii=ii+1-ii(1);
            // else
            // 	ii=ii+size(q.s2,2)-ii(end);
            // end
            if (ii[0] < 0){
                ii = numeric.sub(ii, ii[0]);
            } else {
                const tmp = numeric.add(ii, numeric.dim(q.s2)[1]-1);
                ii = numeric.sub(tmp, ii[ii.length-1]);
            }
        }

        // q.pdf=q.pdf.*q.s2(response+1,ii); % 4 ms
        q.pdf = numeric.mul(q.pdf, get_array_using_index(q.s2[response], ii));
        // if q.normalizePdf
        // 	q.pdf=q.pdf/sum(q.pdf);		% keep the pdf normalized	% 3 ms
        // end
        if (q.normalizePdf){
            q.pdf = numeric.div(q.pdf, numeric.sum(q.pdf));
        }
    }

    // % keep a historical record of the trials
    // q.trialCount = q.trialCount + 1;
    q.trialCount++;

    // if q.trialCount > length(q.intensity)
    if (q.trialCount > q.intensity.length){
        // Out of space in preallocated arrays. Reallocate for additional 10000 trials. 
        // We reallocate in large chunks to reduce memory fragmentation.
        // q.intensity = [q.intensity, zeros(1,10000)];
        // q.response  = [q.response,  zeros(1,10000)];

        const tmp = numeric.rep([10000], 0);
        q.intensity = q.intensity.concat(tmp);
        q.response = q.response.concat(tmp);
    }

    // q.intensity(q.trialCount) = intensity;
    // q.response(q.trialCount)  = response;
    q.intensity[q.trialCount-1] = intensity;
    q.response[q.trialCount-1]  = response;

    return q
}

function QuestMean(q){
    // % t=QuestMean(q)
    // %
    // % Get the mean threshold estimate.
    // % If q is a vector, then the returned t is a vector of the same size.
    // % 
    // % Copyright (c) 1996-2002 Denis Pelli

    // if nargin~=1
    //     error('Usage: t=QuestMean(q)')
    // end
    if (typeof q === 'undefined'){
        alert('Usage: t=QuestMean(q)');
    }
    
    // if length(q)>1
    //     t=zeros(size(q));
    //     for i=1:length(q(:))
    //         t(i)=QuestMean(q(i));
    //     end
    //     return
    // end
    if (Array.isArray(q) && q.length > 1){
        let t= numeric.rep([q.length], 0);
        for (let i = 0; i < q.length; i++){
            t[i] = QuestMean(q[i]);
        }
        return t
    }


    // t=q.tGuess+sum(q.pdf.*q.x)/sum(q.pdf);	% mean of our pdf
    const tmp = numeric.mul(q.pdf, q.x);
    return q.tGuess + numeric.sum(tmp) / numeric.sum(q.pdf);	// % mean of our pdf
}

function QuestSd(q){
    // % sd=QuestSd(q)
    // %
    // % Get the sd of the threshold distribution.
    // % If q is a vector, then the returned t is a vector of the same size.
    // % 
    // % Copyright (c) 1996-1999 Denis Pelli

    // if nargin~=1
    //     error('Usage: sd=QuestSd(q)')
    // end
    if (typeof q === 'undefined'){
        alert('Usage: sd=QuestSd(q)');
    }

    // if length(q)>1
    //     sd=zeros(size(q));
    //     for i=1:length(q(:))
    //         sd(i)=QuestSd(q(i));
    //     end
    //     return
    // end
    if (Array.isArray(q) && q.length > 1){
        let sd= numeric.rep([q.length], 0);
        for (let i = 0; i < q.length; i++){
            sd[i] = QuestSd(q[i]);
        }
        return sd
    }

    // p=sum(q.pdf);
    // sd=sqrt(sum(q.pdf.*q.x.^2)/p-(sum(q.pdf.*q.x)/p).^2);
    const p = numeric.sum(q.pdf);
    const tmp1 = numeric.pow(q.x, 2);
    const tmp2 = numeric.mul(q.pdf, tmp1);
    const tmp3 = numeric.div(numeric.sum(tmp2), p);
    const tmp4 = numeric.mul(q.pdf, q.x);
    const tmp5 = numeric.sum(tmp4);
    const tmp6 = numeric.div(tmp5, p);
    const tmp7 = numeric.pow(tmp6, [2]);
    const tmp8 = numeric.sqrt(numeric.sub(tmp3, tmp7)); // tmp8 is an array containing only one element
    return tmp8[0]

}

function max_with_index(array){
    let tmp_num = -Infinity;
    let tmp_index = -Infinity;
    array.forEach((element, index, array) => {
        if(element > tmp_num){
            tmp_num = element;
            tmp_index = index;
        }
    });
    return {
        value: tmp_num, 
        index: tmp_index}
}


function QuestMode(q){
    // QuestMode returns a JavaScript object which has two properties: 'mode' and 'pdf'.
    // % [t,p]=QuestMode(q)
    // %
    // % "t" is the mode threshold estimate
    // % "p" is the value of the (unnormalized) pdf at t.
    // % 
    // % Copyright (c) 1996-2004 Denis Pelli

    // if nargin~=1
    //     error('Usage: t=QuestMode(q)')
    // end
    if (typeof q === 'undefined'){
        alert('Usage: object = QuestMode(q)');
    }

    // if length(q)>1
    //     t=zeros(size(q));
    //     for i=1:length(q(:))
    //         t(i)=QuestMode(q(i));
    //     end
    //     return
    // end
    if (Array.isArray(q) && q.length > 1){
        let t= numeric.rep([q.length], 0);
        for (let i = 0; i < q.length; i++){
            t[i] = QuestMode(q[i]);
        }
        return t
    }

    // [p,iMode]=max(q.pdf);
    // t=q.x(iMode)+q.tGuess;
    const maximum = max_with_index(q.pdf);
    return {
        mode: q.x[maximum.index] + q.tGuess,
        pdf: maximum.value
    }
}

function QuestBetaAnalysis(q){
    // betaEstimate=QuestBetaAnalysis(q,[fid]);
    // Note that the JavaScript version does not support fid.

    // Analyzes the quest function with beta as a free parameter. It prints (in the file or files pointed to by fid) the mean estimates of alpha (as logC) and beta. 
    // Gamma is left at whatever value the user fixed it at.

    // Note that normalization of the pdf, by QuestRecompute, is disabled because it would need to be done across the whole q vector. 
    // Without normalization, the pdf tends to underflow at around 1000 trials. 
    // You will have some warning of this because the printout mentions any values of beta that were dropped because they had zero probability. 
    // Thus you should keep the number of trials under around 1000, to avoid the zero-probability warnings.

    // % Denis Pelli 5/6/99



    // if nargin<1 || nargin>2
    //     error('Usage: QuestBetaAnalysis(q,[fid])')
    // end
    if (typeof q === 'undefined'){
        alert('Usage: QuestBetaAnalysis(q)');
    }

    // pending
    // if nargin<2
    //     fid=1;
    // end

    // fprintf('Now re-analyzing with both threshold and beta as free parameters. ...\n');
    console.log('Now re-analyzing with both threshold and beta as free parameters. ...');

    // pending
    // for f=fid
    //     fprintf(f,'logC 	 +-sd 	 beta	 +-sd	 gamma\n');
    // end

    // for i=1:length(q(:))
    //     betaEstimate(i)=QuestBetaAnalysis1(q(i),fid);
    // end
    // return
    const betaEstimate = [];
    if (Array.isArray(q)){
        for (let i = 0; i < q.length; i++){
            betaEstimate.push(QuestBetaAnalysis1(q[i]));
        }
    } else {
        betaEstimate.push(QuestBetaAnalysis1(q));
    }
    return betaEstimate
}
    
function find_zero(array){
    for (let i = 0; i < array.length; i++){
        if (array[i] === 0){
            return i
        }
    }
}

function QuestBetaAnalysis1(q){
    // betaEstimate=QuestBetaAnalysis1(q,fid)
    
    // for i=1:16
    //     q2(i)=q;
    //     q2(i).beta=2^(i/4);
    //     q2(i).dim=250;
    //     q2(i).grain=0.02;
    // end
    const q2 =[];
    for (let i = 0; i < 16; i++){
        const obj = Object.assign({}, q);
        obj.beta = Math.pow(2, (i+1)/4);
        obj.dim = 250;
        obj.grain = 0.02;
        q2.push(obj);
    }

    const qq = QuestRecompute(q2);

    // % omit betas that have zero probability
    // for i=1:length(qq)
    //     p(i)=sum(qq(i).pdf);
    // end
    const p = [];
    for (let i =0; i < qq.length; i++){
        p.push(numeric.sum(qq[i].pdf));
    }

    // if any(p==0)
    //     fprintf('Omitting beta values ');
    //     fprintf('%.1f ',qq(find(p==0)).beta);
    //     fprintf('because they have zero probability.\n');
    // end
    const tmp = find_zero(p);
    if (typeof tmp !== 'undefined'){
        console.log('Omitting beta values ');
        console.log(qq[tmp].beta);
        console.log('because they have zero probability.');
    }

    // clear q2
    // q2=qq(find(p));
    // Changed the name of the variable from q2 to q3 to avoid confusion
    const q3 = get_array_using_index(qq, find_non_zero_index(p));

    // t2=QuestMean(q2); % estimate threshold for each possible beta
    const t2 = QuestMean(q3);

    // p2=QuestPdf(q2,t2); % get probability of each of these (threshold,beta) combinations
    const p2 = QuestPdf(q3, t2);

    // sd2=QuestSd(q2); % get sd of threshold for each possible beta
    QuestSd(q3);

    // beta2=[q2.beta];
    const beta2 = [];
    for (let i = 0; i < q3.length; i++){
        beta2.push(q3[i].beta);
    }

    // % for f=fid
    // % 	fprintf(f,'beta ');fprintf(f,'	%7.1f',q2(:).beta);fprintf(f,'\n');
    // % 	fprintf(f,'t    ');fprintf(f,'	%7.2f',t2);fprintf(f,'\n');
    // % 	fprintf(f,'sd   ');fprintf(f,'	%7.2f',sd2);fprintf(f,'\n');
    // % 	fprintf(f,'log p');fprintf(f,'	%7.2f',log10(p2));fprintf(f,'\n');
    // % end
    // console.log(`beta =`);
    // console.log(beta2);
    // console.log(`t =`);
    // console.log(t2);
    // console.log(`sd =`);
    // console.log(sd2);
    // const log_data = []
    // for (let i = 0; i < p2.length; i++){
    //     log_data.push(Math.log10(p2[i]))
    // }
    // console.log(`log10 p =`);
    // console.log(log_data);

    // [p,i]=max(p2); % take mode, i.e. the most probable (threshold,beta) combination
    const maximum = max_with_index(p2);

    // t=t2(i); % threshold at that mode
    const t = t2[maximum.index];

    // %t=QuestMean(q2(i)); % mean threshold estimate

    // sd=QuestSd(q2(i)); % sd of threshold estimate at the beta of that mode
    const sd = QuestSd(q3[maximum.index]);

    // p=sum(p2);
    // Changed the name of the variable from p to tmp_p to avoid confusion
    const tmp_p = numeric.sum(p2);

    // betaMean=sum(p2.*beta2)/p;
    const tmp1 = numeric.mul(p2, beta2);
    const tmp2 = numeric.sum(tmp1);
    const betaMean = numeric.div(tmp2, tmp_p);

    // betaSd=sqrt(sum(p2.*beta2.^2)/p-(sum(p2.*beta2)/p).^2);
    const tmp3 = numeric.mul(p2, numeric.pow(beta2, 2));
    const tmp4 = numeric.div(numeric.sum(tmp3), tmp_p);
    const tmp5 = numeric.pow(betaMean, [2]);
    const betaSd = numeric.sqrt(numeric.sub(tmp4, tmp5))[0];

    // beta has a very skewed distribution, with a long tail out to very large value of beta, whereas 1/beta is more symmetric, with a roughly normal distribution. 
    // Thus it is statistically more efficient to estimate the parameter as 1/average(1/beta) than as average(beta). 
    // "iBeta" stands for inverse beta, 1/beta.
    // The printout takes the conservative approach of basing the mean on 1/beta, but reporting the sd of beta.


    // iBetaMean=sum(p2./beta2)/p;
    const iBetaMean = numeric.div(numeric.sum(numeric.div(p2, beta2)), tmp_p);

    // iBetaSd=sqrt(sum(p2./beta2.^2)/p-(sum(p2./beta2)/p).^2);
    const tmp6 = numeric.div(p2, numeric.pow(beta2, 2));
    const tmp7 = numeric.div(numeric.sum(tmp6), tmp_p);
    const tmp8 = numeric.pow(iBetaMean, [2]);
    const iBetaSd = numeric.sqrt(numeric.sub(tmp7, tmp8));

    // for f=fid
    //     %	fprintf(f,'Threshold %4.2f +- %.2f; Beta mode %.1f mean %.1f +- %.1f imean 1/%.1f +- %.1f; Gamma %.2f\n',t,sd,q2(i).beta,betaMean,betaSd,1/iBetaMean,iBetaSd,q.gamma);
    //     %	fprintf(f,'%5.2f	%4.1f	%5.2f\n',t,1/iBetaMean,q.gamma);
    //     fprintf(f,'%5.2f	%5.2f	%4.1f	%4.1f	%6.3f\n',t,sd,1/iBetaMean,betaSd,q.gamma);
    // end
    console.log(`Threshold ${round2(t, 2)} +- ${round2(sd, 2)}`);
    console.log(`beta = ${1/iBetaMean}`);
    console.log(`Beta mode ${q3[maximum.index].beta} mean ${round2(betaMean, 2)} +- ${round2(betaSd, 2)}`);
    console.log(`imean 1/${round2(1/iBetaMean, 2)} +- ${round2(iBetaSd, 2)}`);
    console.log(`Gamma ${q.gamma} `);
    // console.log(`${t} ${1/iBetaMean} ${q.gamma}`)
    // console.log(`${t} ${sd} ${1/iBetaMean} ${betaSd} ${q.gamma}`)


    // betaEstimate=1/iBetaMean;
    return 1/iBetaMean
}

function QuestPdf(q,t){
    // % p=QuestPdf(q,t)
    // % 
    // % The (possibly unnormalized) probability density of candidate threshold "t".
    // % q and t may be vectors of the same size, in which case the returned p is a vector of that size.
    // % 
    // % Copyright (c) 1996-1999 Denis Pelli

    // if nargin~=2
    //     error('Usage: p=QuestPdf(q,t)')
    // end
    if (typeof q === 'undefined' || typeof t === 'undefined'){
        alert('Usage: p=QuestPdf(q,t)');
    }

    // if size(q)~=size(t)
    //     error('both arguments must have the same dimensions')
    // end
    if (q.length !== t.length){
        alert('both arguments must have the same dimensions');
    }

    // if length(q)>1
    //     p=zeros(size(q));
    //     for i=1:length(q(:))
    //         p(i)=QuestPdf(q(i),t(i));
    //     end
    //     return
    // end
    if (Array.isArray(q) && q.length > 1){
        let p = numeric.rep([q.length], 0);
        for (let i = 0; i < q.length; i++){
            p[i] = QuestPdf(q[i],t[i]);
        }
        return p
    }

    // i=round((t-q.tGuess)/q.grain)+1+q.dim/2;
    // i=min(length(q.pdf),max(1,i));
    // p=q.pdf(i);
    const i = Math.round((t - q.tGuess) / q.grain) + 1 + q.dim / 2;
    const i2 = Math.min(q.pdf.length, Math.max(1, i));
    return q.pdf[i2]
}

// Round off to the specified number of digits.
function round2(value, num){
    return Math.round(value * Math.pow(10, num)) / Math.pow(10, num)
}

function QuestP(q,x){
    // % p=QuestP(q,x)
    // %
    // % The probability of a correct (or yes) response at intensity x, assuming
    // % threshold is at x=0.
    // %
    // % Copyright (c) 1996-2004 Denis Pelli

    // pending
    // JavaScript does not have a isreal function.
    // if ~isreal(x)
    //     error('x must be real, not complex.');
    // end

    // if x<q.x2(1)
    //     p=q.p2(1);
    // elseif x>q.x2(end)
    //     p=q.p2(end);
    // else
    //     p=interp1(q.x2,q.p2,x);
    // end
    let p;
    if (x < q.x2[0]){
        p = q.p2[0];
    } else {
        if (x > q.x2[q.x2.length - 1]){
            p = q.p2[q.x2.length - 1];
        } else {
            p = interp1(q.x2, q.p2, [x])[0];
        }
    }

    // if ~isfinite(p)
    //     q
    //     error(sprintf('psychometric function %g at %.2g',p,x))
    // end
    if (!isFinite(p)){
        console.log(q);
        alert(`psychometric function ${p} at ${x}`);
    }

    return p
}

function indexSort(array) {
    const index = numeric.linspace(0, array.length-1); 
    function compareFunc(a, b){
      return array[a] - array[b]
    }
    return index.sort(compareFunc)
  }

function QuestTrials(q, binsize){
    // % trial=QuestTrials(q,[binsize])
    // % 
    // % Return sorted list of intensities and response frequencies.
    // % "binsize", if supplied, will be used to round intensities to nearest multiple of binsize.
    // % Here's how you might use this function to display your results:
    // % 		t=QuestTrials(q,0.1);
    // % 		fprintf(' intensity     p fit         p    trials\n');
    // % 		disp([t.intensity; QuestP(q,t.intensity-logC); (t.responses(2,:)./sum(t.responses)); sum(t.responses)]');
    
    // % Copyright (c) 1996-1999 Denis Pelli

    // if nargin < 1
    //     error('Usage: trial=QuestTrials(q,[binsize])')
    // end
    if (typeof q === 'undefined'){
        alert('Usage: trial=QuestTrials(q,[binsize])');
    }

    // if nargin < 2
    //     binsize = [];
    // end
    // if isempty(binsize) || ~isfinite(binsize) 
    //     binsize=0;
    // end
    if (typeof binsize === 'undefined' || !isFinite(binsize)){
        binsize = 0;
    }

    // if binsize < 0
    //     error('binsize cannot be negative')
    // end
    if (binsize < 0){
        alert('binsize cannot be negative');
    }

    // if length(q)>1
    //     for i=1:length(q(:))
    //         trial(i)=QuestTrials(q(i)); %#ok<AGROW>
    //     end
    //     return
    // end
    if (Array.isArray(q) && q.length > 1){
        const trial = [];
        for (let i = 0; i < q.length; i++){
            trial.push(QuestTrials(q[i]));
        }
        return trial
    }

    function compareFunc(a, b) {
        return a - b;
    }
  
    // % sort
    // inIntensity = q.intensity(1:q.trialCount);
    // inResponse = q.response(1:q.trialCount);
    // [intensity,i]=sort(inIntensity);
    // response(1:length(i))=inResponse(i);
    const intensity = q.intensity.slice(0, q.trialCount);
    intensity.sort(compareFunc);
    indexSort(q.intensity.slice(0, q.trialCount));
    const response = q.response.slice(0, q.trialCount);

    // % quantize
    // if binsize>0
    //     intensity=round(intensity/binsize)*binsize;
    // end
    let intensity2 = intensity;
    if (binsize > 0){
        const tmp1 = numeric.div(intensity, binsize);
        const tmp2 = numeric.round(tmp1);
        intensity2 = numeric.mul(tmp2, binsize);
    }

    // % compact
    // j=1;
    // trial.intensity(1,j)=intensity(1);
    // trial.responses(1:2,j)=[0 0];
    // for i=1:length(intensity)
    //     if intensity(i)~=trial.intensity(j)
    //         j=j+1;
    //         trial.intensity(1,j)=intensity(i);
    //         trial.responses(1:2,j)=[0 0];
    //     end
    //     trial.responses(response(i)+1,j)=trial.responses(response(i)+1,j)+1;
    // end
    const trial = {
        intensity: [],
        response0: [],
        response1: []
    };
    let tmp_intensity = intensity2[0];
    let response0 = 0;
    let response1 = 0;
    for (let i = 0; i < intensity2.length; i++){
        if (tmp_intensity !== intensity2[i]){
            trial.intensity.push(tmp_intensity);
            trial.response0.push(response0);
            trial.response1.push(response1);

            tmp_intensity = intensity2[i];
            response0 = 0;
            response1 = 0;    
        } 
        
        if (response[i] === 0){
            response0++;
        } else {
            response1++;
        }
    }
    // save the last data
    trial.intensity.push(tmp_intensity);
    trial.response0.push(response0);
    trial.response1.push(response1);
    
    return trial
}

export { QuestBetaAnalysis, QuestBetaAnalysis1, QuestCreate, QuestMean, QuestMode, QuestP, QuestPdf, QuestQuantile, QuestRecompute, QuestSd, QuestSimulate, QuestTrials, QuestUpdate };
//# sourceMappingURL=jsQUEST.module.js.map
