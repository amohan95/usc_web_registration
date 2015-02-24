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

// var REMOTE_URL = 'https://safe-hollows-1871.herokuapp.com';
var REMOTE_URL = 'http://localhost:8000';

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
    $.post(REMOTE_URL + '/authentication/login', $(this).serialize(), function(data) {
      if (data.bearer_token) {
        localStorage.setItem('bearer_token', data.bearer_token);
        $.mobile.changePage('#home', {allowSamePageTransition: true});
      }
    });
  });
});

$(document).on('pagecreate', '#home', function() {
  $.ajax({
    type: 'GET',
    url: REMOTE_URL + '/storage/get_user_sections/',
    data: {term: '20151'},
    beforeSend: function(xhr) {
      xhr.setRequestHeader('Authorization', 'Bearer ' + localStorage.getItem('bearer_token'));
    },
    success: function(data) {
      console.log(data);
    },
    statusCode: {
      401: function() {
        localStorage.removeItem('bearer_token');
        $.mobile.changePage('#login', {allowSamePageTransition: true});
      }
    }
  });
});

$(document).on('pagecreate', '#auto-schedule', function() {
  $('#combination-title').text('');
  $('#combination-list').empty();
  $.ajax({
    type: 'GET',
    url: REMOTE_URL + '/auto_schedule/build_combinations/',
    beforeSend: function(xhr) {
      xhr.setRequestHeader('Authorization', 'Bearer ' + localStorage.getItem('bearer_token'));
    },
    success: function(data) {
      if (Object.keys(data.section_map).length == 0) {
        $('#combination-title').text('Add at least one course to your auto-schedule bin');
      } else {
        sessionStorage.setItem('section_map', JSON.stringify(data.section_map));
        sessionStorage.setItem('combinations', JSON.stringify(data.combinations));
        displayCombination(0);
      }
    },
    statusCode: {
      401: function() {
        localStorage.removeItem('bearer_token');
        $.mobile.changePage('#login', {allowSamePageTransition: true});
      }
    }
  });
});

function displayCombination(i) {
  if (sessionStorage.getItem('section_map') && sessionStorage.getItem('combinations')) {
    var section_map = JSON.parse(sessionStorage.getItem('section_map'));
    var combinations = JSON.parse(sessionStorage.getItem('combinations'));
    if (i < 0) {
      i = 0;
    } else if (i >= combinations.length) {
      i = combinations.length - 1;
    }
    sessionStorage.setItem('current_combination', i);
    $('#combination-title').text('Combination ' + (i + 1) + ' of ' + combinations.length);
    for (var j = 0; j < combinations[i].length; ++j) {
      $('#combination-list').append(createSectionTile(section_map[combinations[i][j]]));
    }
  }
}

$(document).on('swipeleft', '#auto-schedule', function(e) {
  var i = parseInt(sessionStorage.getItem('current_combination')) || 0;
  displayCombination(i + 1);
});

$(document).on('swiperight', '#auto-schedule', function(e) {
  var i = parseInt(sessionStorage.getItem('current_combination')) || 0;
  displayCombination(i - 1);
});

function createCourseTile(course) {
  var courseInfo = $('<div>').addClass('course-info').attr('style', 'display:none;');
  var sectionList = $('<ul>').addClass('section-list');
  courseInfo.append(sectionList);

  var courseTile = $('<div>').addClass('course-tile').attr('data-course-id', course.course_id)
    .append($('<div>').addClass('course-tile-title')
    .append($('<p>').text(course.course_code)
      .append($('<span>')
      .text(", Units: " + (course.min_units == course.max_units ? course.min_units : course.min_units + "-" + course.max_units))))
    .append($('<p>').text(course.title)))
    .append($('<a>')
    .addClass('ui-btn ui-shadow ui-corner-all ui-icon-calendar ui-btn-icon-notext ui-btn-right')
    .click(function(e) {
      e.stopPropagation();
      var popup = $('#autoschedule-popup');
      popup.attr('data-course-id', course.course_id);
      $('#autoschedule-popup-title').text(course.course_code);
      popup.popup('open');
    }))
  .append(courseInfo)
  .click(function() {
    if(!$(this).hasClass('expanded')) {
      $(this).addClass('expanded');
      sectionList.empty();
      $.ajax({
        type: 'POST',
        url: REMOTE_URL + '/search/get_sections_for_course/',
        data: {course_id: course.course_id},
        dataType: 'json',
        beforeSend: function(xhr) {
          xhr.setRequestHeader('Authorization', 'Bearer ' + localStorage.getItem('bearer_token'));
        },
        success: function(data) {
          if(data.success) {
            addSections(data.sections, sectionList);
          }
        },
        statusCode: {
          401: function() {
            localStorage.removeItem('bearer_token');
            $.mobile.changePage('#login', {allowSamePageTransition: true});
          }
        }
      });
    } else {
      $(this).removeClass('expanded');
    }
    $(this).children('.course-info').slideToggle('fast');
  });
  return courseTile;
}

function createSectionTile(section) {
  var sectionTile = $('<div>').addClass('section-tile')
  .attr('data-section-id', section.section_id).attr('data-course-code', section.course_code)
  .append($('<div>').addClass('section-tile-info')
    .append($('<p>').addClass('section-tile-type').text(section.type))
    .append($('<p>').addClass('section-tile-code').text(section.section_code))
    .append($('<p>').addClass('section-tile-location').text(section.location))
    .append($('<p>').addClass('section-tile-instructor').text(section.instructor)))
  .append($('<div>').addClass('section-tile-time')
    .append($('<p>').text(section.begin_time === 'TBA' ? 'TBA' :
                         (convertMilitaryTime(section.begin_time) + '-' +
                          convertMilitaryTime(section.end_time))))
    .append($('<p>').text(section.day)));
  
  sectionTile.click(function(e) {
    e.stopPropagation();
    var popup = $('#schedule-section-popup');
    $('#popup-section-course').text(section.course_code);
    $('#popup-section-tile').empty()
    $('#popup-section-tile').append(sectionTile.clone());
    popup.popup('open');
  });
  return sectionTile;
}

function addCourses(courses, courseArea) {
  courses.forEach(function(course) {
    courseArea.append($('<li>').append(createCourseTile(course)));
  });
  courseArea.listview('refresh');
}

function addSections(sections, sectionArea) {
  sections.forEach(function(section) {
    sectionArea.append($('<li>').append(createSectionTile(section)));
  });
}

var prevQuery = null;
function executeSearch(query_string) {
  if(prevQuery !== null) {
    prevQuery.abort();
  }
  if(query_string.length > 1) {
    var parameters = {};
    $.each($("#search-options input:checked"), function(key, option) {
      parameters[option.value] = true;
    });
    var courseArea = $("#course-results");
    var sectionArea = $("#section-results");
    courseArea.empty();
    sectionArea.empty();
    var loader = $('<div>').append($('<img>').attr('src', './images/ajax-loader.gif'))
                           .addClass('loading');
    courseArea.append(loader.clone());
    sectionArea.append(loader.clone());
    prevQuery = $.ajax({
      type: 'POST',
      url: REMOTE_URL + '/search/execute_query/',
      data: {query_string: query_string, term: '20151', parameters: parameters},
      success: function(data) {
        prevQuery = null;
        if(data.success) {
          if(data.courses.length < 500) {
            $('#course-results-count').text(data.courses.length);
            addCourses(data.courses, courseArea);
          } else {
            $('#course-results-count').text('Too Many!');
          }
          if(data.sections.length < 500) {
            $('#section-results-count').text(data.sections.length);
            addSections(data.sections, sectionArea);
          } else {
            $('#section-results-count').text('Too Many!');
          }
          $('.loading').remove();
        }
      }
    });
  }
}

$(document).on('pagecreate', '#search', function() {
  $('#search-field').on('input', function() {
    executeSearch($(this).val());
  });

  $('#search-options input').on('change', function() {
    executeSearch($('#search-field').val());
  });

  $('#confirm-add-autoschedule').click(function() {
    $.ajax({
      type: 'POST',
      url: REMOTE_URL + '/auto_schedule/add_course/',
      data: {course_id: $("#autoschedule-popup").data('course-id')},
      beforeSend: function(xhr) {
        xhr.setRequestHeader('Authorization', 'Bearer ' + localStorage.getItem('bearer_token'));
      },
      success: function(data) {
        console.log(data);
        $("autoschedule-popup").popup('close');
      },
      statusCode: {
        401: function() {
          localStorage.removeItem('bearer_token');
          $.mobile.changePage('#login', {allowSamePageTransition: true});
        }
      }
    });
  });

  $('#confirm-schedule-section').click(function() {
    $.ajax({
      type: 'POST',
      url: REMOTE_URL + '/storage/schedule_section/',
      data: {section_id: $('#popup-section-tile > div').data('section-id')},
      beforeSend: function(xhr) {
        xhr.setRequestHeader('Authorization', 'Bearer ' + localStorage.getItem('bearer_token'));
      },
      success: function(data) {
        console.log(data);
        $('#schedule-section-popup').popup('close');
      },
      statusCode: {
        401: function() {
          localStorage.removeItem('bearer_token');
          $.mobile.changePage('#login', {allowSamePageTransition: true});
        }
      }
    });
  });
});

function convertMilitaryTime(time_string) {  
  var cIndex = time_string.indexOf(':');
  var hrs = parseInt(time_string.substring(0, cIndex));
  var amPm = hrs > 11 ? 'PM' : 'AM';
  hrs = ((hrs + 11) % 12) + 1;
  var mins = time_string.substring(cIndex + 1, cIndex + 3);
  return hrs + ':' + mins + ' ' + amPm;
}
