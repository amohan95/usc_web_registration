/*!
 *
 *  Web Starter Kit
 *  Copyright 2014 Google Inc. All rights reserved.
 *
 *  Licensed under the Apache License, Version 2.0 (the "License");
 *  you may not use this file except in compliance with the License.
 *  You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 *  Unless required by applicable law or agreed to in writing, software
 *  distributed under the License is distributed on an "AS IS" BASIS,
 *  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *  See the License for the specific language governing permissions and
 *  limitations under the License
 *
 */

var REMOTE_URL = 'https://safe-hollows-1871.herokuapp.com';

$(document).on('pagecontainercreate', function() {
  var closeMenu = function() {
    $('body').removeClass('open');
    $('.app-bar').removeClass('open');
    $('.navdrawer-container').removeClass('open');
  };
  $('main').off('click').click(closeMenu);
  $('.menu').off('click').click(function() {
    $('body').toggleClass('open');
    $('.app-bar').toggleClass('open');
    $('.navdrawer-container').toggleClass('open');
    $('.navdrawer-container').addClass('opened');
  });
  $('.navdrawer-container').off('click').click(function(event) {
    if (event.target.nodeName === 'A' || event.target.nodeName === 'LI') {
      closeMenu();
    }
  });
});

var redirectLogin = function(e, data) {
  var bearer_token = localStorage.getItem('bearer_token');
  if(bearer_token === null || bearer_token === 'undefined') {
    data.toPage = $('#login');
  }
};
$(document).on('pagecontainerbeforechange', redirectLogin);
$(document).on('pagecreate', '#login', function() {
  $('form').submit(function(e) {
    e.preventDefault();
    $.post($(this).attr('action'), $(this).serialize(), function(data) {
      if (data.bearer_token) {
        console.log('setting localStorage.bearer_token to ' + data.bearer_token);
        localStorage.setItem('bearer_token', data.bearer_token);
        console.log(localStorage.getItem('bearer_token'));
        $.mobile.changePage('#home', {allowSamePageTransition: true});
      }
    });
  });
});

$(document).on('pagecreate', '#home', function() {
  $.ajax({
    type: 'POST',
    url: REMOTE_URL + '/storage/get_user_sections/',
    data: {term: '20151'},
    beforeSend: function(xhr) {
      xhr.setRequestHeader('Authorization', 'Bearer ' + localStorage.getItem('bearer_token'));
    },
    success: function(data) {
      console.log(data);
    },
    // error: function(jqXHR, status, error) {
    //   console.log(status, error);
    //   console.log(error.stack);
    // },
    // statusCode: {
    //   401: function() {
    //     localStorage.removeItem('bearer_token');
    //     $.mobile.changePage('#login', {allowSamePageTransition: true});
    //   }
    // }
  });
});

var prevQuery = null;
$(document).on('pagecreate', '#search', function() {
  $('#execute-search').on('input', function() {
    var query_string = $(this).val();
    if(query_string.length > 1) {
      var parameters = {};
      $.each($("#search-options input:checked"), function(key, option) {
        parameters[option.value] = true;
      });
      if(prevQuery !== null) {
        prevQuery.abort();
      }
      prevQuery = $.ajax({
        type: 'POST',
        url: REMOTE_URL + '/search/execute_query/',
        data: {query_string: query_string, term: '20151', parameters: parameters},
        success: function(data) {
          prevQuery = null;
          if(data.success) {
            $('#course-results-count').text(data.courses.length);
            $('#section-results-count').text(data.sections.length);
            console.log(data);
          }
        }
      });
    }
  });
})