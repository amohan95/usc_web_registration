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

/***
 * Constants
***/

var REMOTE_URL = 'https://safe-hollows-1871.herokuapp.com';
// var REMOTE_URL = 'http://10.0.2.2:8000';
// var REMOTE_URL = 'http://localhost:8000';

/***
 * PushPlugin
 ***/
var registrationSuccess =  function(result) {
};

var registrationError = function(error) {
};

function notificationReceived(e) {
  switch(e.event) {
    case 'registered':
      sendAuthenticatedRequest('POST', REMOTE_URL + '/authentication/set_registration_id', {registration_id: e.regid});
      break;
    case 'message':
      console.log(e.message);
      break;
    default:
      break;
  }
}

var pushNotification;
document.addEventListener('deviceready', function(e) {
  pushNotification = window.plugins.pushNotification;
  if (device.platform == 'android' || device.platform == 'Android') {
    pushNotification.register(registrationSuccess, registrationError, {senderID: '225225239291', ecb: 'notificationReceived'});
  }
}, true);

/***
 * DOM Event Handling
 ***/
var scheduled_classes = [];
var registered_classes = [];
var autoscheduled_classes = [];
$(document).ready(function () {
  $(window).resize(function() {
    $("#class-display .section").remove();
    for (var i = 0; i < scheduled_classes.length; i++) {
      showSection(scheduled_classes[i], 'scheduled');
    }
    for(var i = 0; i < registered_classes.length; ++i) {
      showSection(registered_classes[i], 'registered');
    }
    if($('#home').hasClass('auto-schedule')) {
      for(var i = 0;i < autoscheduled_classes.length; ++i) {
        showSection(autoscheduled_classes[i], 'auto-scheduled');
      }
    }
  });
});

$(document).on('pagecontainercreate', function() {
  var closeMenu = function() {
    $('.page-content').removeClass('open');
    $('.app-bar').removeClass('open');
    $('.navdrawer-container').removeClass('open');
  };
  $('.page-content').off('click').click(closeMenu);
  $('.menu').off('click').click(function() {
    $('.page-content').toggleClass('open');
    $('.app-bar').toggleClass('open');
    $('.navdrawer-container').toggleClass('open');
    $('.navdrawer-container').addClass('opened');
  });
  $('.navdrawer-container').off('click').click(function(event) {
    if (event.target.nodeName === 'A' || event.target.nodeName === 'LI') {
      closeMenu();
    }
  });

  $('#auto-schedule').click(function(e) {
    $('#home').addClass('auto-schedule');
    $('#register-sections').hide();
    $.mobile.changePage('#home', {allowSamePageTransition: true});
  });

  $('#home-menu').click(function() {
    $('#combination-title').text('');
    $('#home').removeClass('auto-schedule');
    $('#register-sections').show();
    $('#class-display .section').remove();
    $.mobile.changePage('#home', {allowSamePageTransition: true});
  });

  $('#logout').click(function(e) {
    e.preventDefault();
    sendAuthenticatedRequest(
      'POST', REMOTE_URL + '/authentication/logout', {},
      function(data) {
        localStorage.removeItem('bearer_token');
        $.mobile.changePage('#login', {allowSamePageTransition: true});
      });
  });
  $.event.special.swipe.scrollSupressionThreshold = 10; // More than this horizontal displacement, and we will suppress scrolling.
  $.event.special.swipe.horizontalDistanceThreshold = 30; // Swipe horizontal displacement must be more than this.
  $.event.special.swipe.durationThreshold = 500;  // More time than this, and it isn't a swipe.
  $.event.special.swipe.verticalDistanceThreshold = 75; 
  $(document).on('swipeleft', '.auto-schedule #calendar', function(e) {
    changeCombination(1);
  });
  $(document).on('swiperight', '.auto-schedule #calendar', function(e) {
    changeCombination(-1);
  });
  $(document).on('keydown', '.auto-schedule #calendar', function(e) {
    e.preventDefault();
    switch(e.which) {
      case 37:
        changeCombination(-1);
        break;
      case 39:
        changeCombination(1);
        break;
    }
  });
});

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

$('#home').on('pageshow', function() {
  if(!$('#home').hasClass('auto-schedule')) {
    getCourseBin(false);
  } else {
    retrieveAutoSchedule();
  }
});

$('#home').on('pagecreate', function() {
  if(!$('#home').hasClass('auto-schedule')) {
    $('#top-text').empty().append($('<span>').text('USC ').append($('<strong>').text('Web Registration')));
    getCourseBin(false);
  } else {
    $('#top-text').empty().text('Auto Schedule');
  }
  $('#schedule-auto-schedule').click(function(e) {
    e.preventDefault();
    sendAuthenticatedRequest(
      'POST', REMOTE_URL + '/storage/schedule_sections', {section_ids: getCombination(getCurrentCombinationIndex())},
      function(data) {
        sendAuthenticatedRequest(
          'POST', REMOTE_URL + '/auto_schedule/clear_courses', {},
          function(data) {
            $('#home').removeClass('auto-schedule');
            $.mobile.changePage('#home', {allowSamePageTransition: true});
          }
        );
      }
    );
  });
  $('#register-sections').click(function(e) {
    e.preventDefault();
    sendAuthenticatedRequest(
      'POST', REMOTE_URL + '/storage/register_sections', {},
      function(data) {
        $.mobile.changePage('#home', {allowSamePageTransition: true});
      }
    );
  });
  $('#confirm-remove-auto-schedule-course').click(function(e) {
    e.preventDefault();
    sendAuthenticatedRequest(
      'POST', REMOTE_URL + '/auto_schedule/remove_course/', {course_id: $('#auto-schedule-remove-course-popup').data('course-id')},
      function(data) {
        $('#auto-schedule-remove-course-popup').popup('close');
        retrieveAutoSchedule();
      }
    );
  });
  $('#confirm-include-auto-schedule-section').click(function(e) {
    e.preventDefault();
    sendAuthenticatedRequest(
      'POST', REMOTE_URL + '/auto_schedule/add_included_section/', {section_id: $('#auto-schedule-include-section-popup').data('section-id')},
      function(data) {
        $('#auto-schedule-include-section-popup').popup('close');
        retrieveAutoSchedule();
      }
    );
  });
  $('#confirm-exclude-auto-schedule-section').click(function(e) {
    e.preventDefault();
    sendAuthenticatedRequest(
      'POST', REMOTE_URL + '/auto_schedule/add_excluded_section/', {section_id: $('#auto-schedule-exclude-section-popup').data('section-id')},
      function(data) {
        $('#auto-schedule-exclude-section-popup').popup('close');
        retrieveAutoSchedule();
      }
    );
  });
});

$("#course-bin").on("pageshow" , function() {
  getCourseBin(true)
});

$(document).on('pagecreate', '#search', function() {
  $('#back-btn').click(function() {
    $.mobile.changePage('#home', {allowSamePageTransition: true});
  });
  $('#search-field').parent().attr('id', 'search-field-outer');
  $('#search-field-outer').parent().attr('id', 'search-field-outer2');
  $('#back-btn').removeClass('ui-btn').removeClass('ui-shadow').removeClass('ui-corner-all');
  $('.search').removeClass('ui-btn').removeClass('ui-shadow').removeClass('ui-corner-all');
  $('#search-field').on('input', function() {
    executeSearch($(this).val());
  });

  $('#change-settings').click(function() {
    $('#search-settings-container').slideToggle('fast');
  });

  $('#search-options input').on('change', function() {
    executeSearch($('#search-field').val());
  });

  $('#confirm-add-autoschedule').click(function() {
    showLoading()
    sendAuthenticatedRequest(
      'POST', REMOTE_URL + '/auto_schedule/add_course/', {course_id: $('#autoschedule-popup').data('course-id')},
      function(data) {
        hideLoading();
        $('#autoschedule-popup').popup('close');
      }
    );
  });

  $('#confirm-schedule-section').click(function() {
    showLoading();
    sendAuthenticatedRequest(
      'POST', REMOTE_URL + '/storage/schedule_section/', {section_id: $('#popup-section-tile > div').data('section-id')},
      function(data) {
        hideLoading();
        $('#schedule-section-popup').popup('close');
      }
    );
  });
});

$(document).on('pagecreate', '#course-bin', function() {
  $('.menu').removeClass('ui-btn').removeClass('ui-shadow').removeClass('ui-corner-all');
  $('.search').removeClass('ui-btn').removeClass('ui-shadow').removeClass('ui-corner-all');
  $('#confirm-unschedule-section').click(function() {
    showLoading();
    sendAuthenticatedRequest(
      'POST', REMOTE_URL + '/storage/unschedule_section', {section_id: $('#popup-unschedule-section-tile > div').data('section-id')},
      function(data) {
        hideLoading();
        $('#unschedule-section-popup').popup('close');
        getCourseBin(true);
      }
    );
  });
  $('#confirm-unregister-section').click(function() {
    showLoading();
    sendAuthenticatedRequest(
      'POST', REMOTE_URL + '/storage/unregister_sections', {course_code: $('#popup-unregister-section-tile > div').data('course-code')},
      function(data) {
        hideLoading();
        $('#unregister-section-popup').popup('close');
        getCourseBin(true);
      }
    );
  });
});

$(document).on('pagecreate', '#home', function() {
  $('.menu').removeClass('ui-btn').removeClass('ui-shadow').removeClass('ui-corner-all');
  $('.search').removeClass('ui-btn').removeClass('ui-shadow').removeClass('ui-corner-all');
});

/***
 * Functions
 ***/
function convertMilitaryTime(time_string) {
  if(time_string == null) {
    return "";
  }
  var cIndex = time_string.indexOf(':');
  var hrs = parseInt(time_string.substring(0, cIndex));
  var amPm = hrs > 11 ? 'PM' : 'AM';
  hrs = ((hrs + 11) % 12) + 1;
  var mins = time_string.substring(cIndex + 1, cIndex + 3);
  return hrs + ':' + mins + ' ' + amPm;
}

function showLoading() {
  $.mobile.loading('show', {
    theme: $.mobile.loader.prototype.options.theme,
    text: '',
    textVisible: false,
    textonly: false
  });
}

function hideLoading() {
  $.mobile.loading('hide');
}

function getCourseBin(use_bin) {
  showLoading();
  if (use_bin) {
    sendAuthenticatedRequest(
      'GET', REMOTE_URL + '/storage/get_user_sections/', {term: '20151'},
      function(data) {
        scheduled_classes = data.scheduled;
        registered_classes = data.registered;
        displayCourseBin();
        $.mobile.loading('hide');
      }
    );
  } else {
    sendAuthenticatedRequest(
      'GET', REMOTE_URL + '/storage/get_user_sections/', {term: '20151'},
      function(data) {
        scheduled_classes = data.scheduled;
        registered_classes = data.registered;
        showClassCal(data);
        $.mobile.loading('hide');
      }
    );
  }
}

//Takes an array
function showClassCal(data) {
  $("#class-display .section").remove();
  var scheduled = data.scheduled;
  for (var i = 0; i < scheduled.length; i++) {
    showSection(scheduled[i], 'scheduled');
  }
  var registered = data.registered;
  for (var i = 0; i < registered.length; ++i) {
    showSection(registered[i], 'registered');
  }
}

//Takes a section
function showSection(data, type) {
  if(data.begin_time != "TBA") {
    var day = data.day;
    while (day.length > 0) {
      if ( day[0] == 'M') {
        displayClass(2, data, type);
        day = day.substring(1,day.length);
      } else if ( day[0] == 'T') {
        displayClass(3, data, type);
        day = day.substring(1,day.length);
      } else if ( day[0] == 'W') {
        displayClass(4, data, type);
        day = day.substring(1,day.length);
      } else if ( day[0] == 'H') {
        displayClass(5, data, type);
        day = day.substring(1,day.length);
      }else if ( day[0] == 'F') {
        displayClass(6, data, type);
        day = day.substring(1,day.length);
      } else {
        break;
      }
    }
  }
}

//Calculates position of class and displays it
function displayClass(day, data, type) {
  var time = parseInt(data.begin_time.substring(0,2))-5;
  var halftime = parseInt(data.begin_time.substring(3,5));
  var duration = calculateClassTime(data);
  var cell = $("#cal-table tr:nth-child(" + time + ") td:nth-child(" + day + ")");
  var offset = cell.position();
  var width = cell.width() + 1;
  var height = duration*(cell.height()+1) + duration -1;
  var top = offset.top;
  var left = offset.left +1;
  if(halftime == 30) {
    top += (cell.height()+1)/2;
  }
  var lab = "";
  if (data.type == "Lab") {
    lab = "L";
  }
  $("#class-display").append($("<div>").addClass('section').addClass('section-' + type)
    .css("width",width).css("height",height)
    .offset({top:top, left:left})
    .text(data.course_code + lab + '\n' + data.section_code));
}

//Returns class duration
function calculateClassTime(data) {
  var starttime = parseInt(data.begin_time.substring(0,2))-5;
  var starthalftime = parseInt(data.begin_time.substring(3,5));
    starttime += starthalftime/60.0;
  var endtime = parseInt(data.end_time.substring(0,2))-5;
  var endhalftime = parseInt(data.end_time.substring(3,5));
    endtime += endhalftime/60.0;
  if (endhalftime == '20' || endhalftime == '50') {
    endtime += .1;
  }
  return endtime - starttime;
}

var redirectLogin = function(e, data) {
  var bearer_token = localStorage.getItem('bearer_token');
  if(bearer_token === null || bearer_token === 'undefined') {
    data.toPage = $('#login');
  }
};

function displayCombination(i) {
  var current_combination = getCombination(i);
  if (sessionStorage.getItem('section_map') && current_combination) {
    var section_map = JSON.parse(sessionStorage.getItem('section_map'));
    var num_combinations = getNumCombinations();
    if (i < 0) {
      i = 0;
    } else if (i >= num_combinations) {
      i = combinations.length - 1;
    }
    $('#combination-list').empty();
    if (i >= 0) {
      sessionStorage.setItem('current_combination', i);
      $('#combination-title').text('Combination ' + (i + 1) + ' of ' + num_combinations);
      $("#class-display .section.section-auto-scheduled").remove();
      autoscheduled_classes = [];
      for (var j = 0; j < current_combination.length; ++j) {
        showSection(section_map[current_combination[j]], 'auto-scheduled');;
        autoscheduled_classes.push(section_map[current_combination[j]]);
      }
      for (var i = 0; i < scheduled_classes.length; i++) {
        showSection(scheduled_classes[i], 'scheduled');
      }
      for(var i = 0; i < registered_classes.length; ++i) {
        showSection(registered_classes[i], 'registered');
      }
    }
  }
}

function changeCombination(j) {
  var i = getCurrentCombinationIndex();
  displayCombination(i + j);
}

function getCurrentCombinationIndex() {
  return parseInt(sessionStorage.getItem('current_combination')) || 0;
}

function getNumCombinations() {
  return parseInt(sessionStorage.getItem('num_combinations')) || 0;
}

function getCombination(i) {
  if (sessionStorage.getItem('combinations')) {
    return JSON.parse(sessionStorage.getItem('combinations'))[i];
  } else {
    return undefined;
  }
}

function createSectionTile(section, courseTitle) {
  var sectionTile = $('<div>').addClass('section-tile')
  .attr('data-section-id', section.section_id).attr('data-course-code', section.course_code)
  .append($('<div>').addClass('section-tile-info')
    .append(courseTitle ? $('<p>').text(section.course_code) : '')
    .append($('<p>').append($('<span>').addClass('section-tile-type').text(section.type)
    .append($('<span>').addClass('section-tile-code').text("\t" + section.section_code))))
    .append($('<p>').addClass('section-tile-location').text(section.location)))
  .append($('<div>').addClass('section-tile-time')
    .append($('<p>').text(section.begin_time === 'TBA' ? 'TBA' :
                         (convertMilitaryTime(section.begin_time) + '-' + '\n' +
                          convertMilitaryTime(section.end_time))))
    .append($('<p>').text(section.day))
    .append($('<p>').text(section.number_registered ? section.number_registered + '/' + section.number_seats : '')))
  .append($('<p>').addClass('section-tile-instructor').text(section.instructor));

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

function createCourseBinTile(section, type) {
  var sectionTile = $('<div>').addClass('section-tile')
  .attr('data-section-id', section.section_id).attr('data-course-code', section.course_code)
  .append($('<div>').addClass('section-tile-info')
    .append($('<p>').addClass('section-tile-name').text(section.course_code))
    .append($('<p>').addClass('section-tile-type').text(section.type))
    .append($('<p>').addClass('section-tile-code').text(section.section_code))
    .append($('<p>').addClass('section-tile-location').text(section.location)))
  .append($('<div>').addClass('section-tile-time')
    .append($('<p>').html(section.begin_time === 'TBA' ? 'TBA' :
                         (convertMilitaryTime(section.begin_time) + '-' + '<br/>' +
                          convertMilitaryTime(section.end_time))))
    .append($('<p>').text(section.day)))
  .append($('<p>').addClass('section-tile-instructor').text(section.instructor));

  sectionTile.click(function(e) {
    e.stopPropagation();
    var popup = $('#un' + type + '-section-popup').popup();
    $('#popup-un' + type + '-section-course').text(section.course_code);
    $('#popup-un' + type + '-section-tile').empty();
    $('#popup-un' + type + '-section-tile').append(sectionTile.clone());
    popup.popup('open');
  });
  return sectionTile;
}

function addCourses(courses, courseArea) {
  courses.forEach(function(course) {
    courseArea.append($('<li>').append(createCourseTile(course)).addClass('course-li'));
  });
  courseArea.listview('refresh');
}

function addSections(sections, sectionArea, courseTitle) {
  sections.forEach(function(section) {
    sectionArea.append($('<li>').addClass(section.conflict ? 'section-tile-conflict' : '').append(createSectionTile(section, courseTitle)));
  });
}

var prevQuery = null;
function executeSearch(query_string) {
  if(prevQuery !== null) {
    prevQuery.abort();
  }

  var parameters = {};
  $.each($("#search-options input:checked"), function(key, option) {
    parameters[option.value] = true;
  });
  if(Object.keys(parameters).length == 0) {
    parameters.default = true;
  }
  if(query_string.length > 1) {
    var courseArea = $("#course-results");
    var sectionArea = $("#section-results");
    courseArea.empty();
    sectionArea.empty();
    var loader = $('<div>').append($('<img>').attr('src', './images/ajax-loader.gif'))
                           .addClass('loading');
    courseArea.append(loader.clone());
    sectionArea.append(loader.clone());
    prevQuery = sendAuthenticatedRequest(
      'POST', REMOTE_URL + '/search/execute_query/', {query_string: query_string, term: '20151', parameters: parameters},
      function(data) {
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
            addSections(data.sections, sectionArea, true);
            sectionArea.listview('refresh');
          } else {
            $('#section-results-count').text('Too Many!');
          }
        }
        $('.loading').remove();
      }
    );
  } else {
    $('.loading').remove();
    $('#course-results-count').text('0');
    $('#section-results-count').text('0');
  }
}

function createCourseTile(course) {
  var courseInfo = $('<div>').addClass('course-info').attr('style', 'display:none;');
  var sectionList = $('<ul>').addClass('section-list');
  courseInfo.append(sectionList);

  var courseTile = $('<div>').addClass('course-tile').attr('data-course-id', course.course_id)
    .append($('<div>').addClass('course-tile-title')
    .append($('<p>').addClass('course-tile-code').text(course.course_code))
    .append($('<p>').text(course.title))
    .append($('<p>').addClass('course-tile-units').text(" " + (course.min_units == course.max_units ? course.min_units : course.min_units + "-" + course.max_units) + " Units")))
    .append($('<a>')
    .addClass('ui-btn ui-shadow ui-corner-all ui-icon-calendar ui-btn-icon-notext ui-btn-right')
    .click(function(e) {
      e.stopPropagation();
      var popup = $('#autoschedule-popup').popup();
      popup.data('course-id', course.course_id);
      $('#autoschedule-popup-title').text(course.course_code);
      popup.popup('open');
    }))
  .append(courseInfo)
  .click(function() {
    if(!$(this).hasClass('expanded')) {
      $(this).addClass('expanded');
      sectionList.empty();
      sendAuthenticatedRequest(
        'POST', REMOTE_URL + '/search/get_sections_for_course/', {course_id: course.course_id},
        function(data) {
          if(data.success) {
            addSections(data.sections, sectionList, false);
          }
        }
      );
    } else {
      $(this).removeClass('expanded');
    }
    $(this).children('.course-info').slideToggle('fast');
  });
  return courseTile;
};

function sendAuthenticatedRequest(type, url, data, success, error) {
  return $.ajax({
    type: type,
    url: url,
    data: data,
    beforeSend: function(xhr) {
      xhr.setRequestHeader('Authorization', 'Bearer ' + localStorage.getItem('bearer_token'));
    },
    success: success,
    error: error,
    statusCode: {
      401: function() {
        localStorage.removeItem('bearer_token');
        $.mobile.changePage('#login', {allowSamePageTransition: true});
      }
    }
  });
}

function displayCourseBin() {
  var scheduledArea = $('#course-display-scheduled');
  var registeredArea = $('#course-display-registered');
  scheduledArea.empty();
  registeredArea.empty();
  for (var i = 0; i < scheduled_classes.length; i++) {
    scheduledArea.append(createCourseBinTile(scheduled_classes[i], 'schedule'));
  }
  for(var i = 0; i < registered_classes.length; ++i) {
    registeredArea.append(createCourseBinTile(registered_classes[i], 'register'));
  }
}

function retrieveAutoSchedule() {
  $('#home').addClass('auto-schedule');
  $('#combination-title').text('');
  $('#auto-schedule-courses').empty();
  $("#class-display .section.section-auto-scheduled").remove();
  sendAuthenticatedRequest(
    'GET', REMOTE_URL + '/auto_schedule/build_combinations/', {},
    function(data) {
      sessionStorage.setItem('current_combination', 0);
      displayAutoSchedule(data);
    }
  );
}

function displayAutoSchedule(data) {
  if (Object.keys(data.section_map).length == 0) {
    $('#combination-title').text('Add at least one course to your auto-schedule bin');
    $('#schedule-auto-schedule').hide();
  } else {
    sessionStorage.setItem('section_map', JSON.stringify(data.section_map));
    sessionStorage.setItem('combinations', JSON.stringify(data.combinations));
    sessionStorage.setItem('num_combinations', data.combinations.length);
    if (data.combinations.length == 0) {
      $('#combination-title').text('No valid combinations with your current schedule');
      $('#schedule-auto-schedule').hide();
    } else {
      $('#schedule-auto-schedule').show();
    }
    displayCombination(getCurrentCombinationIndex());
    var courses = {};
    for (var key in data.section_map) {
      var course_code = data.section_map[key].course_code;
      if (courses.hasOwnProperty(course_code)) {
        courses[course_code].push(data.section_map[key]);
      } else {
        courses[course_code] = [data.section_map[key]];
      }
    }
    for (var key in courses) {
      var sections = $('<ul>').addClass('sections');
      courses[key].forEach(function(section) {
        var lab = '';
        if (section.type == "Lab") {
          lab = " Lab";
        }
        sections.append($('<li>').data('course-id', data.course_map[key].course_id).append($('<p>').text(section.section_code + lab + "\n" + (section.begin_time === 'TBA' ? 'TBA':
                         (convertMilitaryTime(section.begin_time) + '-' +
                          convertMilitaryTime(section.end_time))) + "\n" + section.day)).append($('<a>').addClass('ui-btn ui-shadow ui-corner-all ui-icon-check ui-btn-icon-notext').click(
          function(e) {
            e.stopPropagation();
            var popup = $('#auto-schedule-include-section-popup').popup();
            popup.data('course-id', $(this).parent().data('course_id'));
            popup.data('section-id', section.section_id);
            $('#auto-schedule-include-section-popup-title').text(section.section_code);
            popup.popup('open');
          })).append($('<a>').addClass('ui-btn ui-shadow ui-corner-all ui-icon-forbidden ui-btn-icon-notext').click(
            function(e) {
              e.stopPropagation();
              var popup = $('#auto-schedule-exclude-section-popup').popup();
              popup.data('section-id', section.section_id);
              $('#auto-schedule-exclude-section-popup-title').text(section.section_code);
              popup.popup('open');
            })));
      });
      var course = $('<li>').data('course-id', data.course_map[key].course_id).data('course-code', key).text(key).click(function(e) {
        if(!$(this).hasClass('expanded')) {
          $(this).addClass('expanded');
          sections.show();
        } else {
          $(this).removeClass('expanded');
          sections.hide();
        }
        $(this).children('.sections').slideToggle('fast');
      }).append($('<a>').addClass('ui-btn ui-shadow ui-corner-all ui-icon-delete ui-btn-icon-notext').click(
        function(e) {
          e.stopPropagation();
          var popup = $('#auto-schedule-remove-course-popup').popup();
          popup.data('course-id', $(this).parent().data('course-id'));
          $('#auto-schedule-remove-course-popup-title').text($(this).parent().data('course-code'));
          popup.popup('open');
        })).append(sections);
      sections.hide();
      $('#auto-schedule-courses').append(course);
    }
  }
}
