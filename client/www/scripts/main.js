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
// var REMOTE_URL = 'https://safe-hollows-1871.herokuapp.com';
// var REMOTE_URL = 'http://10.0.2.2:8000';
var REMOTE_URL = 'http://localhost:8000';

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
  pushNotification.register(registrationSuccess, registrationError, {senderID: '225225239291', ecb: 'notificationReceived'});
}, true);

/***
 * DOM Event Handling
 ***/
 var current_classes = {};
$(document).ready(function () {
  $(window).resize(function(){
    $("#class-display .section").remove();
    for (var i = 0; i < current_classes.length; i++) {
      showSection(current_classes[i]);
    }
  });
  $('#home-menu').click(function() {
    $('#combination-title').text('');
    $('#home').removeClass('auto-schedule');
    $("#class-display").empty();
    getCourseBin(false);
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
    console.log("menu button");
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
    e.preventDefault();
    $('#home').addClass('auto-schedule');
    $.mobile.changePage('#home', {allowSamePageTransition: true});
    $('#combination-title').text('');
    $('#combination-list').empty();
    sendAuthenticatedRequest(
      'GET', REMOTE_URL + '/auto_schedule/build_combinations/', {},
      function(data) {
        if (Object.keys(data.section_map).length == 0) {
          $('#combination-title').text('Add at least one course to your auto-schedule bin');
        } else {
          sessionStorage.setItem('section_map', JSON.stringify(data.section_map));
          sessionStorage.setItem('combinations', JSON.stringify(data.combinations));
          sessionStorage.setItem('num_combinations', data.combinations.length);
          displayCombination(getCurrentCombinationIndex());
        }
      }
    );
  });
  $('#logout').click(function(e) {
    e.preventDefault();
    localStorage.removeItem('bearer_token');
    $.post(REMOTE_URL + '/authentication/logout', function(data) {
      $.mobile.changePage('#login', {allowSamePageTransition: true});
    });
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

$('#home').on('pagecreate', function() {
  if(!$('#home').hasClass('auto-schedule')) {
    $('#top-text').empty().append($('<span>').text('USC ').append($('<strong>').text('Web Registration')));
    getCourseBin(false);
  } else {
    $('#top-text').empty().text('Auto Schedule');
  }
});

$("#course-bin").on("pageshow" , function() {
  getCourseBin(true)
});

$("#auto-schedule").click( function(e) {
  e.preventDefault();
  $('#home').addClass('auto-schedule');
  $.mobile.changePage('#home', {allowSamePageTransition: true});
  $('#combination-title').text('');
  $('#combination-list').empty();
  sendAuthenticatedRequest(
    'GET', REMOTE_URL + '/auto_schedule/build_combinations/', {},
    function(data) {
      if (Object.keys(data.section_map).length == 0) {
        $("#class-display").empty();
        $('#combination-title').text('Add at least one course to your auto-schedule bin');
      } else {
        sessionStorage.setItem('section_map', JSON.stringify(data.section_map));
        sessionStorage.setItem('combinations', JSON.stringify(data.combinations));
        displayCombination(0);
      }
    }
  );
});

$('#schedule-auto-schedule').click(function() {
  sendAuthenticatedRequest(
    'POST', REMOTE_URL + '/storage/schedule_sections', {section_ids: getCombination(getCurrentCombinationIndex())},
    function(data) {
      $.mobile.changePage('#home', {allowSamePageTransition: true});
    });
});

  $(document).on('swipeleft', '.auto-schedule', function(e) {
    changeCombination(1);
  });

  $(document).on('swiperight', '.auto-schedule', function(e) {
    changeCombination(-1);
  });

  $(document).on('keydown', '.auto-schedule', function(e) {
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
    sendAuthenticatedRequest(
      'POST', REMOTE_URL + '/auto_schedule/add_course/', {course_id: $('#autoschedule-popup').data('course-id')},
      function(data) {
        $('#autoschedule-popup').popup('close');
      }
    );
  });

  $('#confirm-schedule-section').click(function() {
    sendAuthenticatedRequest(
      'POST', REMOTE_URL + '/storage/schedule_section/', {section_id: $('#popup-section-tile > div').data('section-id')},
      function(data) {
        $('#schedule-section-popup').popup('close');
      }
    );
  });
});

$(document).on('pagecreate', '#course-bin', function() {
  $('.menu').removeClass('ui-btn').removeClass('ui-shadow').removeClass('ui-corner-all');
  $('.search').removeClass('ui-btn').removeClass('ui-shadow').removeClass('ui-corner-all');
  $('#confirm-remove-section').click(function() {
    sendAuthenticatedRequest(
      'POST', REMOTE_URL + '/storage/unschedule_section', {section_id: $('#popup-remove-section-tile > div').data('section-id')},
      function(data) {
        $('#remove-section-popup').popup('close');
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
  var cIndex = time_string.indexOf(':');
  var hrs = parseInt(time_string.substring(0, cIndex));
  var amPm = hrs > 11 ? 'PM' : 'AM';
  hrs = ((hrs + 11) % 12) + 1;
  var mins = time_string.substring(cIndex + 1, cIndex + 3);
  return hrs + ':' + mins + ' ' + amPm;
}

function getCourseBin(display) {
  if (display) {
    sendAuthenticatedRequest(
      'GET', REMOTE_URL + '/storage/get_user_sections/', {term: '20151'},
      function(data) {
        current_classes = data.scheduled;
        displayCourseBin();
      }
    );
  } else {
    sendAuthenticatedRequest(
      'GET', REMOTE_URL + '/storage/get_user_sections/', {term: '20151'},
      function(data) {
        current_classes = data.scheduled;
        showClassCal(data);
        console.log(data);
      }
    );
  }
}

//Takes an array
function showClassCal(data) {
  $("#class-display .section").remove();
  var classes = data.scheduled;
  for (var i = 0; i < classes.length; i++) {
    showSection(classes[i]);
  }
}

//Takes a section
function showSection(data) {
  if(data.begin_time != "TBA") {
    var day = data.day;
    while (day.length > 0) {
      if ( day[0] == 'M') {
        displayClass(2, data);
        day = day.substring(1,day.length);
      } else if ( day[0] == 'T') {
        displayClass(3, data);
        day = day.substring(1,day.length);
      } else if ( day[0] == 'W') {
        displayClass(4, data);
        day = day.substring(1,day.length);
      } else if ( day[0] == 'H') {
        displayClass(5, data);
        day = day.substring(1,day.length);
      }else if ( day[0] == 'F') {
        displayClass(6, data);
        day = day.substring(1,day.length);
      } else {
        break;
      }
    }
  }
}

//Calculates position of class and displays it
function displayClass(day, data) {
  var time = parseInt(data.begin_time.substring(0,2))-5;
  var halftime = parseInt(data.begin_time.substring(3,5));
  var duration = calculateClassTime(data);
  var cell = $("#cal-table tr:nth-child("+time+") td:nth-child("+day+")");
  var offset = cell.position();
  var width = cell.width() + 1;
  var height = duration*(cell.height()+1) + duration -1;
  var top = offset.top+1-60;
  var left = offset.left+1;
  if(halftime == 30) {
    top += (cell.height()+1)/2;
  }
  $("#class-display").append($("<div>").attr('class', 'section').css("width",width).css("height",height).offset({top:top, left:left}).text(data.course_code));
}

//Returns class duration
function calculateClassTime(data) {
  var starttime = parseInt(data.begin_time.substring(0,2))-5;
  var starthalftime = parseInt(data.begin_time.substring(3,5));
  if(starthalftime == 30) {
    starttime += .5;
  }
  var endtime = parseInt(data.end_time.substring(0,2))-5;
  var endhalftime = parseInt(data.end_time.substring(3,5));
  if(endhalftime == 20) {
    endtime += .5;
  } else if(endhalftime == 50) {
    endtime += 1;
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
    if (i >= 0) {
      $('#combination-list').empty();
      sessionStorage.setItem('current_combination', i);
      $('#combination-title').text('Combination ' + (i + 1) + ' of ' + num_combinations);
      $("#class-display .section").remove();
      current_classes = [];
      for (var j = 0; j < current_combination.length; ++j) {
        showSection(section_map[current_combination[j]]);
        current_classes.push(section_map[current_combination[j]]);
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

function createSectionTile(section) {
  var sectionTile = $('<div>').addClass('section-tile')
  .attr('data-section-id', section.section_id).attr('data-course-code', section.course_code)
  .append($('<div>').addClass('section-tile-info')
    .append($('<p>').append($('<span>').addClass('section-tile-type').text(section.type)
    .append($('<span>').addClass('section-tile-code').text("\t" + section.section_code))))
    .append($('<p>').addClass('section-tile-location').text(section.location)))
  .append($('<div>').addClass('section-tile-time')
    .append($('<p>').text(section.begin_time === 'TBA' ? 'TBA' :
                         (convertMilitaryTime(section.begin_time) + '-' +
                          convertMilitaryTime(section.end_time))))
    .append($('<p>').text(section.day))
    .append((section.conflict ?
    "<btn class='ui-btn ui-shadow ui-corner-all ui-icon-alert ui-btn-icon-notext conflict-alert'>Conflict</btn>" : '')))
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

function createCourseBinTile(section) {
  var sectionTile = $('<div>').addClass('section-tile')
  .attr('data-section-id', section.section_id).attr('data-course-code', section.course_code)
  .append($('<div>').addClass('section-tile-info')
    .append($('<p>').addClass('section-tile-name').text(section.course_code))
    .append($('<p>').addClass('section-tile-type').text(section.type))
    .append($('<p>').addClass('section-tile-code').text(section.section_code))
    .append($('<p>').addClass('section-tile-location').text(section.location)))
  .append($('<div>').addClass('section-tile-time')
    .append($('<p>').text(section.begin_time === 'TBA' ? 'TBA' :
                         (convertMilitaryTime(section.begin_time) + '-' +
                          convertMilitaryTime(section.end_time))))
    .append($('<p>').text(section.day)))
  .append($('<p>').addClass('section-tile-instructor').text(section.instructor));

  sectionTile.click(function(e) {
    e.stopPropagation();
    var popup = $('#remove-section-popup').popup();
    $('#popup-remove-section-course').text(section.course_code);
    $('#popup-remove-section-tile').empty()
    $('#popup-remove-section-tile').append(sectionTile.clone());
    popup.popup('open');
    console.log($('#popup-remove-section-tile > div').data('section-id'));
  });
  return sectionTile;
}

function addCourses(courses, courseArea) {
  courses.forEach(function(course) {
    courseArea.append($('<li>').append(createCourseTile(course)).addClass('course-li'));
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
      beforeSend: function(xhr) {
        xhr.setRequestHeader('Authorization', 'Bearer ' + localStorage.getItem('bearer_token'));
      },
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
            sectionArea.listview('refresh');
          } else {
            $('#section-results-count').text('Too Many!');
          }
        }
        $('.loading').remove();
      },
      statusCode: {
        401: function() {
          localStorage.removeItem('bearer_token');
          $.mobile.changePage('#login', {allowSamePageTransition: true});
        }
      }
    });
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
      var popup = $('#autoschedule-popup');
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
            addSections(data.sections, sectionList);
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

function convertMilitaryTime(time_string) {
  var cIndex = time_string.indexOf(':');
  var hrs = parseInt(time_string.substring(0, cIndex));
  var amPm = hrs > 11 ? 'PM' : 'AM';
  hrs = ((hrs + 11) % 12) + 1;
  var mins = time_string.substring(cIndex + 1, cIndex + 3);
  return hrs + ':' + mins + ' ' + amPm;
}

function sendAuthenticatedRequest(type, url, data, success) {
  return $.ajax({
    type: type,
    url: url,
    data: data,
    beforeSend: function(xhr) {
      xhr.setRequestHeader('Authorization', 'Bearer ' + localStorage.getItem('bearer_token'));
    },
    success: success,
    statusCode: {
      401: function() {
        localStorage.removeItem('bearer_token');
        $.mobile.changePage('#login', {allowSamePageTransition: true});
      }
    }
  });
}

function displayCourseBin() {
  $('#course-display').empty();
  for (var i = 0; i < current_classes.length; i++) {
    $('#course-display').append(createCourseBinTile(current_classes[i]));
  }
}
