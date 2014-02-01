/*
 * jQuery.zip2addr
 *
 * Copyright 2010, Kotaro Kokubo a.k.a kotarok kotaro@nodot.jp
 * Dual licensed under the MIT or GPL Version 2 licenses.
 *
 * Orign:
 * https://github.com/kotarok/jQuery.zip2addr
 * Fork:
 * https://github.com/chaika-design/jQuery.zip2addr
 */
$.fn.zip2addr = function(options) {
  var target;

  var setting = (function(options) {
    if(typeof options != 'object') {
      target = {addr: options};
    } else {
      target = jQuery.extend({}, jQuery.fn.zip2addr.defaults, options);
    }
  })(options);

  var c = {
    api: location.protocol + '//www.google.com/transliterate?langpair=ja-Hira|ja&jsonp=?',
    prefectureToken: '(東京都|道|府|県)',
    zipDelimiter: '-'
  };

  var cache = $.fn.zip2addr.cache;

  var getAddr = function (zip) {
    var defer = jQuery.Deferred();
    jQuery.ajax({
      url: c.api,
      data: {'text':zip},
      dataType: 'json',
      type: 'get',
      success: defer.resolve,
      error: defer.reject
    });
    return defer.promise();
  };

  var fillAddr = (function() {
    if(target.pref) {
      var $addr = $(target.addr);
      var $pref = $(target.pref);
      return function(addr){
        var addrs = addr.split(',');
        var value = $addr.val();
        if(addrs){
          if( !RegExp(addrs[1]).test(value) ) {
            $pref.val(addrs[0]);
            $addr.val(addrs[1]);
          }
        } else if(!RegExp(addrs[1]).test( value )) {
          $pref.add(target.addr).val('');
        }
      };
    } else {
      return function(addr) {
        var addrStr = addr.replace(',','');
        var addrField = target.addr || target;
        var $addrField = $(addrField);
        var value = $addrField.val();
        if(addrStr){
          if(!RegExp(addrStr).test(value)) {
            $addrField.val(addrStr);
          }
        } else if(!RegExp(addrStr).test(value)) {
          $addrField.val('');
        }
      };
    }
  })();

  //From http://liosk.blog103.fc2.com/blog-entry-72.html
  var fascii2ascii = (function() {
    var pattern = /[\uFF01-\uFF5E]/g, replace = function(m) {
      return String.fromCharCode(m.charCodeAt() - 0xFEE0);
    };
    return function(s){return s.replace(pattern, replace);};
  })();

  var check = function(_val) {
    var val = fascii2ascii(_val).replace(/\D/g,'');
    if(val.length == 7) {
      if(cache[val] == undefined) {
        getAddr( val.replace(/(\d\d\d)(\d\d\d\d)/,'$1-$2') ).done(function(json) {
          if(RegExp(c.prefectureToken).test(json[0][1][0])) {
            var v = json[0][1][0].replace( RegExp('(.*?'+c.prefectureToken+')(.+)'), function(a,b,c,d){return [b,d];} );
            cache[val] = v;
            fillAddr(v);
          }
        }).fail(function( jqXHR, textStatus, errorThrown ) {
          console.log('Ajax Error', jqXHR, textStatus, errorThrown);
        });
      } else {
        fillAddr(cache[val]);
      }
    }
  };

  this.each(function() {
    var $t = $(this);
    if(target.zip2) {
      var $zip2 = $(target.zip2);
      $t.add($zip2).on('keyup.zip2addr change.zip2addr', function() {
        check($t.val()+''+$zip2.val());
      }).on('blur.zip2addr', function() {
        var $inp = $(this),
            val = $inp.val();
        if(val.length === 7) {
          $inp.val( fascii2ascii(val) );
        }
      });
    } else {
      $t.on('keyup.zip2addr change.zip2addr', function() {
        check($t.val());
      }).on('blur.zip2addr',function() {
        var val = $t.val();
        if(val.length === 7) {
          $t.val( fascii2ascii(val).replace(/\D/g,'').replace(/(\d\d\d)(\d\d\d\d)/,'$1'+c.zipDelimiter+'$2') );
        }
      });
    }
  });

  return this;
};
$.fn.zip2addr.defaults = {
  zip2: null,
  addr: null,
  pref: null
};
$.fn.zip2addr.cache = {};
