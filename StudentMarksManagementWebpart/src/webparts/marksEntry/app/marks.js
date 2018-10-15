
var siteUrl = localStorage.getItem("url");
var PrincipalVal = new Array();
var studArray = new Array();
var ExamTypeArray = new Array();
var rowsCount = 0;
var saveCount = 0;
var reqDigest = "";
var examTypes = [];
var currentExam = "";
var teacherName = "";
var currentUserType = "Teacher";
var subID = "C4DC3B1F-780E-4A5D-B8CB-457B9FF35122";
var docID;
var GUID;

$(document).ready(function () {
    getTeacherDetails();
    getCurrentUser();
    examTypes = {
        "ILAC": "ILAC Test",
        "KET": "KET",
        "PET": "PET",
        "FCE": "FCE",
        "CAE": "CAE",
        "CPE": "CPE",
        "TOFEL": "TOFEL",
        "ILETS": "ILETS",
        "BECL": "BEC Lower",
        "BECH": "BEC Higher",
        "PTOFEL": "Pathway TOEFL",
        "PIIITOFEL": "Pathway III TOEFL"
    };
    examNames = {
        "ILAC Test": "ILAC",
        "KET": "KET",
        "PET": "PET",
        "FCE": "FCE",
        "CAE": "CAE",
        "CPE": "CPE",
        "TOFEL": "TOFEL",
        "ILETS": "ILETS",
        "BEC Lower": "BECL",
        "BEC Higher": "BECH",
        "Pathway TOFEL": "PTOFEL",
        "Pathway III TOFEL": "PIIITOFEL"
    };
    getTeachernamebasedonEmail();
    $("#btnSave").on("click", function () {
        workOnIt();
        countRecordstoSave();
    });
    getTermStructureDetails();
    teacherName = $("#ddlTeacher").val();
    $('input[type=radio][name=optradio]').change(function () {
        workOnIt();
        $("#mainContainer").html('');
        studArray = [];
        PrincipalVal = [];
        getStudentsFromTeacherName();
    });
    $("#btnSearch").on("click", function () {
        workOnIt();
        $("#mainContainer").html('');
        studArray = [];
        PrincipalVal = [];
        getStudentbasedonSearch();
    });
    $("#btnSubmit").on("click", function () {
        submitMarksandmakeuserInActive();
    });
    $("#ddlTeacher").change(function () {
        workOnIt();
        $("#mainContainer").html('');
        studArray = [];
        PrincipalVal = [];
        getStudentsFromTeacherName();
    });
});
function getTermStructureDetails() {
    var today = new Date();
    var dd = today.getDate();
    var mm = today.getMonth() + 1; //January is 0!

    var yyyy = today.getFullYear();
    if (dd < 10) {
        dd = '0' + dd;
    }
    if (mm < 10) {
        mm = '0' + mm;
    }
    var todayDate = mm + '/' + dd + '/' + yyyy;
    //var todayDate = '06/17/2018';

    var apiPath = siteUrl + "/_api/lists/getbytitle('TermStructure')/items?$select=SessionName&$filter=Start le '" + todayDate + "' and End ge '" + todayDate + "'";
    RestApiGet(apiPath).done(function (results) {
        if (results.length > 0) {
            $("input[name=optradio][value=" + results[0].SessionName + "]").prop('checked', true);
        }
        else {
            alert("Please select exam type.");
        }
    });
}
function submitMarksandmakeuserInActive() {
    workOnIt();
    var listName = "Students";
    var reqData = JSON.stringify
        ({
            __metadata:
            {
                type: "SP.Data." + listName + "ListItem"
            },
            isActive: false
        });
    var totalStudents = studArray.length;
    studArray.forEach(element => {
        RestApiPost(listName, element.Id, element.GUID,reqData).done(function () {
            if (totalStudents == saveCount) {
                close();
                saveCount = 0;
                showToastrResult();
                setTimeout(function () {
                    location.reload();
                }, 300);
            }
        });
    });
}
function getTeacherDetails() {
    var deferred = $.Deferred();
    var apiPath = siteUrl + "/_api/lists/getbytitle('Teachers')/items?$select=*&$top=1000";
    var div = document.getElementById("ddlTeacher");
    var myHtml =
        '<option value="0">Select Teacher</option>';
    div.innerHTML += myHtml;
    RestApiGet(apiPath).done(function (results) {
        for (var i = 0; i < results.length; i++) {
            var myHtml =
                '<option value="' + results[i].Title + '">' + results[i].Title + '</option>';
            div.innerHTML += myHtml;
        }
        deferred.resolve(true);
    });
    return deferred.promise();
}

function getTeachernamebasedonEmail() {
    var apiPath = siteUrl + "/_api/lists/getbytitle('Teachers')/items?$select=Title&$filter=Email eq '" + localStorage.getItem("currentUserName") + "'";
    RestApiGet(apiPath).done(function (results) {
        if (results.length > 0) {
            $("#ddlTeacher").val(results[0].Title);
            getFormDgst();
        }
    });
}

function showToastr() {
    // Get the snackbar DIV
    var x = document.getElementById("snackbar");

    // Add the "show" class to DIV
    x.className = "show";

    // After 3 seconds, remove the show class from DIV
    setTimeout(function () { x.className = x.className.replace("show", ""); }, 3000);
}
function showToastrResult() {
    // Get the snackbar DIV
    var x = document.getElementById("snackbarResult");

    // Add the "show" class to DIV
    x.className = "show";

    // After 3 seconds, remove the show class from DIV
    setTimeout(function () { x.className = x.className.replace("show", ""); }, 3000);
}

function getFormDgst() {
    $.ajax({
        url: siteUrl + "/_api/contextinfo",
        method: "POST",
        headers: { "Accept": "application/json; odata=verbose" },
        success: function (data) {
            reqDigest = data.d.GetContextWebInformation.FormDigestValue;
        },
        error: function (data, errorCode, errorMessage) {
            alert(errorMessage)
        }
    });
}

function countRecordstoSave() {
    $('tbody > tr').each(function (index, row) {
        if ($(this).find('td:last-child').text() != "" && $(this).find('td:last-child').text() != "0") {
            rowsCount++;
        }
    });
    saveMarksDetails();
}

function RestApiGet(apiPath) {
    var deferred = $.Deferred();
    $.ajax({
        url: apiPath,
        headers: {
            Accept: "application/json;odata=verbose"
        },
        async: false,
        success: function (data) {

            var items; // Data will have user object  
            var results;
            if (data != null) {
                items = data.d;
                if (items != null) {
                    results = items.results;
                    deferred.resolve(results);
                }
            }
        },
        eror: function (data) {
            console.log("An error occurred. Please try again.");
            deferred.reject(0);
        }
    });
    return deferred.promise();
}

function RestApiPost(listName, id, reqdata) {
    var deferred = $.Deferred();
    var headerValue = "";
    if (id != 0) {
        var apiPath = siteUrl + "/_api/web/lists/GetByTitle('" + listName + "')/items(" + id + ")";
        headerValue = {
            "Accept": "application/json;odata=verbose",
            "Content-Type": "application/json;odata=verbose",
            "X-RequestDigest": reqDigest,
            "IF-MATCH": "*",
            "X-HTTP-Method": "MERGE"
        };
    } else {
        var apiPath = siteUrl + "/_api/web/lists/GetByTitle('" + listName + "')/items";
        headerValue = {
            "Accept": "application/json;odata=verbose",
            "Content-Type": "application/json;odata=verbose",
            "X-RequestDigest": reqDigest,
        };
    }
    $.ajax({
        url: apiPath,
        type: "POST",
        headers: headerValue,
        data: reqdata,
        success: function (data) {
            saveCount = saveCount + 1;
            deferred.resolve(true);
        },
        error: function (error) {
            alert(JSON.stringify(error));
            deferred.reject(0);
        }
    });
    return deferred.promise();
}

function RestApiPost(listName, id, GUID, reqdata) {
    var deferred = $.Deferred();
    var headerValue = "";
    if (id != 0) {
        var apiPath = siteUrl + "/_api/web/lists/GetByTitle('" + listName + "')/items(" + id + ")";
        headerValue = {
            "Accept": "application/json;odata=verbose",
            "Content-Type": "application/json;odata=verbose",
            "X-RequestDigest": reqDigest,
            "IF-MATCH": "*",
            "X-HTTP-Method": "MERGE"
        };
    } else {
        var apiPath = siteUrl + "/_api/web/lists/GetByTitle('" + listName + "')/items";
        headerValue = {
            "Accept": "application/json;odata=verbose",
            "Content-Type": "application/json;odata=verbose",
            "X-RequestDigest": reqDigest,
        };
    }
    $.ajax({
        url: apiPath,
        type: "POST",
        headers: headerValue,
        data: reqdata,
        success: function (data) {
            saveCount = saveCount + 1;
            console.log("ID:"+id);
            console.log("GUID:"+GUID);
            GUID=GUID;
            docID=id;
            startnewWF();
            deferred.resolve(true);
        },
        error: function (error) {
            alert(JSON.stringify(error));
            deferred.reject(0);
        }
    });
    return deferred.promise();
}

function startnewWF() {
    $.ajax({  
        url:siteUrl+"/_api/SP.WorkflowServices.WorkflowInstanceService.Current/StartWorkflowOnListItemBySubscriptionId(subscriptionId='"+subID+"',itemId='"+docID+"')",  
        type: "POST",  
        contentType: "application/json;odata=verbose",  
        headers: {  
            "Accept": "application/json;odata=verbose",  
            "X-RequestDigest": reqDigest  
        },  
        success: function (data) {  
            console.log('Workflow Trigger Successfully');  
        },  
        error: function (data) {  
            console.log("Error in Triggering Worflow");  
        }  
    });
    }

function getCurrentUser() {

    $.ajax({
        url: siteUrl + "/_api/web/CurrentUser",
        method: "GET",
        headers: { "Accept": "application/json; odata=verbose" },
        success: function (data) {
            getCurrentUserGroupColl(data.d.Id);
        },
        error: function (data) {
            failure(data);
        }
    });
}

function getCurrentUserGroupColl(UserID) {
    $.ajax
        ({
            url: siteUrl + "/_api/web/GetUserById(" + UserID + ")/Groups",
            method: "GET",
            headers: { "Accept": "application/json; odata=verbose" },
            success: function (data) {
                /* get all group's title of current user. */
                var results = data.d.results;
                for (var i = 0; i < results.length; i++) {
                    if (results[i].Title == "SuperAdmin") {
                        currentUserType = "SuperAdmin";
                        $("#ddlTeacher").val(0);
                        $("#ddlTeacher").attr('disabled', false);
                        $("#searchboxDiv").show();
                        break;
                    }
                    else if (results[i].Title == "Admin") {
                        currentUserType = "Admin";
                        $("#ddlTeacher").attr('disabled', false);
                    }
                }

                if (currentUserType == "Teacher" || currentUserType == "Admin") {
                    getStudentsFromTeacherName();
                } else {
                    var mainDiv = document.getElementById('mainContainer');
                    var headerDiv = `<div class="container-fluid">
                        <table class="table table-bordered table-condensed">
                            <thead>
                                <tr>
                                    <th>No Records Found</th>
                               </tr>
                            </thead>
                    </table>
                    </div>`;
                    mainDiv.innerHTML += headerDiv;
                    close();
                }
            }
        });
}

function getStudentbasedonSearch() {
    if ($("#StudentSearchBox").val() != "" && $("#StudentSearchBox").val() != undefined) {
        var apiPath = siteUrl + "/_api/lists/getbytitle('Students')/items?$select=Student_x0020_No,Title,GUID,Principal,Student_x0020_Level,Email,ID&$filter=Student_x0020_No eq '" + $("#StudentSearchBox").val() + "' and isActive eq 1";
        RestApiGet(apiPath).done(function (results) {
            for (var i = 0; i < results.length; i++) {
                studArray.push({
                    "Name": results[i].Title,
                    "StudNo": results[i].Student_x0020_No,
                    "Level": results[i].Student_x0020_Level,
                    "PrincipalVal": results[i].Principal,
                    "examType": "",
                    "Email": results[i].Email,
                    "Id": results[i].ID,
                    "GUID":results[i].GUID
                });
                PrincipalVal.push(results[i].Principal);
            }
            var uniquePrincipalVal = PrincipalVal.filter(function (elem, pos) {
                return PrincipalVal.indexOf(elem) == pos;
            }.bind(this));
            if (uniquePrincipalVal.length > 0) {
                getClassFromProfesiancyTest(uniquePrincipalVal[0]);
            }
            else {
                var mainDiv = document.getElementById('mainContainer');
                var headerDiv = `<div class="container-fluid">
                        <table class="table table-bordered table-condensed">
                            <thead>
                                <tr>
                                    <th>No Records Found</th>
                               </tr>
                            </thead>
                    </table>
                    </div>`;
                mainDiv.innerHTML += headerDiv;
                close();
            }
        });
    }
}

function getStudentsFromTeacherName() {

    if ($("#ddlTeacher").val() != 0) {
        var apiPath = siteUrl + "/_api/lists/getbytitle('Students')/items?$select=Student_x0020_No,Title,Principal,Student_x0020_Level,GUID,Email,ID&$filter=Principal_x0020__x002d__x0020_Te eq '" + $("#ddlTeacher").val() + "' and isActive eq 1";
        RestApiGet(apiPath).done(function (results) {

            for (var i = 0; i < results.length; i++) {
                studArray.push({
                    "Name": results[i].Title,
                    "StudNo": results[i].Student_x0020_No,
                    "Level": results[i].Student_x0020_Level,
                    "PrincipalVal": results[i].Principal,
                    "examType": "",
                    "Email": results[i].Email,
                    "Id": results[i].ID,
                    "GUID":results[i].GUID
                });
                PrincipalVal.push(results[i].Principal);
            }
            var uniquePrincipalVal = PrincipalVal.filter(function (elem, pos) {
                return PrincipalVal.indexOf(elem) == pos;
            }.bind(this));
            if (uniquePrincipalVal.length > 0) {
                if (uniquePrincipalVal.length > 1) {
                    getClassFromProfesiancyTestMultiple(uniquePrincipalVal);
                } else {
                    getClassFromProfesiancyTest(uniquePrincipalVal[0]);
                }
            } else {
                var mainDiv = document.getElementById('mainContainer');
                var headerDiv = `<div class="container-fluid">
                        <table class="table table-bordered table-condensed">
                            <thead>
                                <tr>
                                    <th>No Records Found</th>
                               </tr>
                            </thead>
                    </table>
                    </div>`;
                mainDiv.innerHTML += headerDiv;
                close();
            }
        });
    }
}

function getClassFromProfesiancyTest(classname) {

    var apiPath = siteUrl + "/_api/lists/getbytitle('Classes')/items?$select=ProficiencyTest,Title&$filter=Title eq '" + classname + "'";
    RestApiGet(apiPath).done(function (results) {
        var data = '{ "Title":"' + results[0].Title + '","ProficiencyTest":"' + results[0].ProficiencyTest + '"}';
        ExamTypeArray.push(JSON.parse(data));
        for (var index = 0; index < results.length; index++) {
            studArray.forEach(element => {
                if (element.PrincipalVal == results[index].Title) {
                    element.examType = results[index].ProficiencyTest;
                }
            });
        }
        currentExam = results[0].ProficiencyTest;
        bindOuterHtml(currentExam);
        bindInnerHtml(currentExam);
        bindInputchange();
        bindListDataifExist();
        close();
    });
}

function getClassFromProfesiancyTestMultiple(classname) {
    var title = "";
    for (var i = 0; i < classname.length; i++) {
        if (i == classname.length - 1) {
            title += "Title eq '" + classname[i] + "' ";
        } else {
            title += "Title eq '" + classname[i] + "' or ";
        }
    }
    var apiPath = siteUrl + "/_api/lists/getbytitle('Classes')/items?$select=ProficiencyTest,Title&$filter=" + title;
    RestApiGet(apiPath).done(function (results) {
        for (var index = 0; index < results.length; index++) {
            studArray.forEach(element => {
                if (element.PrincipalVal == results[index].Title) {
                    element.examType = results[index].ProficiencyTest;
                }
            });
        }
    });
    var uniqueExams = [];
    for (i = 0; i < studArray.length; i++) {
        if (uniqueExams.indexOf(studArray[i].examType) === -1) {
            uniqueExams.push(studArray[i].examType);
        }
    }
    uniqueExams.forEach(element => {
        bindOuterHtml(element);
        bindInnerHtml(element);
    });
    bindInputchange();
    bindListDataifExist();
    close();
}

function bindInputchange() {

    $(".input-sm").change(function () {
        var max = parseInt($(this).attr('max'));
        var min = parseInt($(this).attr('min'));
        if ($(this).val() > max) {
            $(this).val(max);
        }
        else if ($(this).val() < min) {
            $(this).val(min);
        }
    });

    $('#tBodyILAC .ilacinput').on('change', function () {
        var $tr = $(this).closest('tr'); // get tr which contains the input
        var tot = 0; // variable to sore sum
        $('input', $tr).each(function () { // iterate over inputs
            tot += Number($(this).val()) || 0; // parse and add value, if NaN then add 0
        });
        $('td:last', $tr).text((tot / 100).toFixed(3)); // update last column value
    }).trigger('input');

    $('#tBodyCPE .cpeinput').on('change', function () {
        var $tr = $(this).closest('tr'); // get tr which contains the input
        var tot = 0; // variable to sore sum
        var writingPT2 = Number($tr.find("td:nth-child(8) input").val()) || 0;
        var writingPT1 = Number($tr.find("td:nth-child(7) input").val()) || 0;
        var RandUOE = Number($tr.find("td:nth-child(5) input").val()) || 0;
        var Listening = Number($tr.find("td:nth-child(6) input").val()) || 0;
        var writing = (writingPT1 + writingPT2) / 2;
        var tot = RandUOE + Listening + writing;
        $('td:last', $tr).text((tot / 122).toFixed(3)); // update last column value
    }).trigger('input');

    $('#tBodyTOFEL .tofelinput').on('change', function () {
        var $tr = $(this).closest('tr'); // get tr which contains the input
        var tot = 0; // variable to sore sum
        var writing = Number($tr.find("td:nth-child(5) input").val()) || 0;
        var Reading = Number($tr.find("td:nth-child(6) input").val()) || 0;
        var Listening = Number($tr.find("td:nth-child(7) input").val()) || 0;
        var tot = (((((writing / 10) + (Reading / 42) + (Listening / 34)) / 3) * 90).toFixed(3));
        $('td:last', $tr).text(tot); // update last column value
    }).trigger('input');

    $('#tBodyILETS .iletsinput').on('change', function () {
        var $tr = $(this).closest('tr'); // get tr which contains the input
        var tot = 0; // variable to sore sum
        var writingpart1 = Number($tr.find("td:nth-child(5) input").val()) || 0;
        var writingpart2 = Number($tr.find("td:nth-child(6) input").val()) || 0;
        var Listening = Number($tr.find("td:nth-child(7) input").val()) || 0;
        var Reading = Number($tr.find("td:nth-child(8) input").val()) || 0;
        tot = (((writingpart1 * 0.333) + (writingpart2 * 0.667) + Listening + Reading).toFixed(3));
        $('td:last', $tr).text(tot); // update last column value
    }).trigger('input');

    $('#tBodyKET .ketinput').on('change', function () {
        var $tr = $(this).closest('tr'); // get tr which contains the input
        var tot = 0; // variable to sore sum
        var courseworkspeaking = Number($tr.find("td:nth-child(5) input").val()) || 0;
        var courseworkwriting = Number($tr.find("td:nth-child(6) input").val()) || 0;
        var courseworkclasswork = Number($tr.find("td:nth-child(7) input").val()) || 0;
        var courseworkresult = (((courseworkspeaking + courseworkwriting + courseworkclasswork) / 100).toFixed(3));
        $tr.find('td:nth-child(8)').text(courseworkresult);
        var examReading = Number($tr.find("td:nth-child(9) input").val()) || 0;
        var examListening = Number($tr.find("td:nth-child(10) input").val()) || 0;
        $tr.find('td:last', $tr).text(((examReading + examListening) / 80).toFixed(3)); // update last column value
    }).trigger('input');

    $('#tBodyPET .petinput').on('change', function () {
        var $tr = $(this).closest('tr'); // get tr which contains the input
        var tot = 0; // variable to sore sum
        var courseworkspeaking = Number($tr.find("td:nth-child(5) input").val()) || 0;
        var courseworkwriting = Number($tr.find("td:nth-child(6) input").val()) || 0;
        var courseworkclasswork = Number($tr.find("td:nth-child(7) input").val()) || 0;
        var courseworkresult = (((courseworkspeaking + courseworkwriting + courseworkclasswork) / 100).toFixed(3));
        $tr.find('td:nth-child(8)').text(courseworkresult);
        var examReading = Number($tr.find("td:nth-child(9) input").val()) || 0;
        var examListening = Number($tr.find("td:nth-child(10) input").val()) || 0;
        $tr.find('td:last', $tr).text(((examReading + examListening) / 65).toFixed(3));
    }).trigger('input');

    $('#tBodyFCE .fceinput').on('change', function () {
        var $tr = $(this).closest('tr'); // get tr which contains the input
        var tot = 0; // variable to sore sum
        var courseworkspeaking = Number($tr.find("td:nth-child(5) input").val()) || 0;
        var courseworkwriting = Number($tr.find("td:nth-child(6) input").val()) || 0;
        var courseworkclasswork = Number($tr.find("td:nth-child(7) input").val()) || 0;
        var courseworkresult = (((courseworkspeaking + courseworkwriting + courseworkclasswork) / 100).toFixed(3));
        $tr.find('td:nth-child(8)').text(courseworkresult);
        var examReading = Number($tr.find("td:nth-child(9) input").val()) || 0;
        var examListening = Number($tr.find("td:nth-child(10) input").val()) || 0;
        $tr.find('td:last', $tr).text(((examReading + examListening) / 100).toFixed(3));
    }).trigger('input');

    $('#tBodyCAE .caeinput').on('change', function () {
        var $tr = $(this).closest('tr'); // get tr which contains the input
        var tot = 0; // variable to sore sum
        var courseworkspeaking = Number($tr.find("td:nth-child(5) input").val()) || 0;
        var courseworkwriting = Number($tr.find("td:nth-child(6) input").val()) || 0;
        var courseworkclasswork = Number($tr.find("td:nth-child(7) input").val()) || 0;
        var courseworkresult = (((courseworkspeaking + courseworkwriting + courseworkclasswork) / 100).toFixed(3));
        $('td:nth-child(8)').text(courseworkresult);
        var examReading = Number($tr.find("td:nth-child(9) input").val()) || 0;
        var examListening = Number($tr.find("td:nth-child(10) input").val()) || 0;
        $('td:last', $tr).text(((examReading + examListening) / 108).toFixed(3));
    }).trigger('input');

    $('#tBodyBECL .beclinput').on('change', function () {
        var $tr = $(this).closest('tr'); // get tr which contains the input
        var tot = 0; // variable to sore sum
        var courseworkspeaking = Number($tr.find("td:nth-child(5) input").val()) || 0;
        var courseworkwriting = Number($tr.find("td:nth-child(6) input").val()) || 0;
        var courseworkresult = (((courseworkspeaking + courseworkwriting) / 100).toFixed(3));
        $tr.find('td:nth-child(7)').text(courseworkresult);
        var courseworkclasswork = Number($tr.find("td:nth-child(8) input").val()) || 0;
        var examReading = Number($tr.find("td:nth-child(9) input").val()) || 0;
        var examListening = Number($tr.find("td:nth-child(10) input").val()) || 0;
        $tr.find('td:last', $tr).text(((examReading + examListening + courseworkclasswork) / 105).toFixed(3));
    }).trigger('input');

    $('#tBodyBECH .bechinput').on('change', function () {
        var $tr = $(this).closest('tr'); // get tr which contains the input
        var tot = 0; // variable to sore sum
        var courseworkspeaking = Number($tr.find("td:nth-child(5) input").val()) || 0;
        var courseworkwriting = Number($tr.find("td:nth-child(6) input").val()) || 0;
        var courseworkresult = (((courseworkspeaking + courseworkwriting) / 100).toFixed(3));
        $tr.find('td:nth-child(7)').text(courseworkresult);
        var courseworkclasswork = Number($tr.find("td:nth-child(8) input").val()) || 0;
        var examReading = Number($tr.find("td:nth-child(9) input").val()) || 0;
        var examListening = Number($tr.find("td:nth-child(10) input").val()) || 0;
        $tr.find('td:last', $tr).text(((examReading + examListening + courseworkclasswork) / 112).toFixed(3));
    }).trigger('input');

    $('#tBodyPTOFEL .ptofelinput').on('change', function () {
        var $tr = $(this).closest('tr'); // get tr which contains the input
        var participationhw12 = Number($tr.find("td:nth-child(5) input").val()) || 0;
        var quiz1 = Number($tr.find("td:nth-child(6) input").val()) || 0;
        var quiz2 = Number($tr.find("td:nth-child(7) input").val()) || 0;
        var inclasswriting = Number($tr.find("td:nth-child(8) input").val()) || 0;
        var participationhw34 = Number($tr.find("td:nth-child(9) input").val()) || 0;
        var longessayoutline = Number($tr.find("td:nth-child(10) input").val()) || 0;
        var quiz3 = Number($tr.find("td:nth-child(11) input").val()) || 0;
        var draftprocess = Number($tr.find("td:nth-child(12) input").val()) || 0;
        var researchpresentation = Number($tr.find("td:nth-child(13) input").val()) || 0;
        var sp1 = Number($tr.find("td:nth-child(14) input").val()) || 0;
        var sp2 = Number($tr.find("td:nth-child(15) input").val()) || 0;
        var sp3 = Number($tr.find("td:nth-child(16) input").val()) || 0;
        var finallongessay = Number($tr.find("td:nth-child(17) input").val()) || 0;
        var courseworkresult = (Number(participationhw12 + inclasswriting + participationhw34 + longessayoutline + draftprocess + Number((quiz1 + quiz2 + quiz3) / 60 * 15) + Number(researchpresentation / 100 * 20) + Number(finallongessay / 100 * 20) + Number((sp1 + sp2 + sp3) / 75 * 10))).toFixed(2);
        $tr.find('td:nth-child(18)').text(courseworkresult + " %");
        var writing = Number($tr.find("td:nth-child(19) input").val()) || 0;
        var Reading = Number($tr.find("td:nth-child(20) input").val()) || 0;
        var Listening = Number($tr.find("td:nth-child(21) input").val()) || 0;
        var finalresult = Math.round(120 * ((20 * writing / 10) + (20 * Reading / 42) + (20 * Listening / 34)) / 60);
        $tr.find('td:last', $tr).text(finalresult);
    }).trigger('input');

    $('#tBodyPIIITOFEL .pitofelinput').on('change', function () {
        var $tr = $(this).closest('tr'); // get tr which contains the input
        var participationhw = Number($tr.find("td:nth-child(5) input").val()) || 0;
        var quiz1 = Number($tr.find("td:nth-child(6) input").val()) || 0;
        var quiz2 = Number($tr.find("td:nth-child(7) input").val()) || 0;
        var inclasswriting = Number($tr.find("td:nth-child(8) input").val()) || 0;
        var longessayoutline = Number($tr.find("td:nth-child(9) input").val()) || 0;
        var quiz3 = Number($tr.find("td:nth-child(10) input").val()) || 0;
        var draftprocess = Number($tr.find("td:nth-child(11) input").val()) || 0;
        var researchpresentation = Number($tr.find("td:nth-child(12) input").val()) || 0;
        var sp1 = Number($tr.find("td:nth-child(13) input").val()) || 0;
        var sp2 = Number($tr.find("td:nth-child(14) input").val()) || 0;
        var sp3 = Number($tr.find("td:nth-child(15) input").val()) || 0;
        var finallongessay = Number($tr.find("td:nth-child(16) input").val()) || 0;
        var courseworkresult = ((participationhw +
            inclasswriting +
            longessayoutline +
            draftprocess +
            ((quiz1 + quiz2 + quiz3) / 60 * 15) +
            (researchpresentation / 100 * 20) +
            ((sp1 + sp2 + sp3) / 75 * 15) +
            (finallongessay / 100 * 15))).toFixed(2);
        $tr.find('td:nth-child(17)').text(courseworkresult + " %");
        var Writing = Number($tr.find("td:nth-child(18) input").val()) || 0;
        var Reading = Number($tr.find("td:nth-child(19) input").val()) || 0;
        var Listening = Number($tr.find("td:nth-child(20) input").val()) || 0;
        var finalresult = Math.round(120 * ((20 * Writing / 10) + (20 * Reading / 42) + (20 * Listening / 34)) / 60);
        $tr.find('td:last', $tr).text(finalresult);
    }).trigger('input');

}

function bindListDataifExist() {
    $("#tBodyILAC > tr").each(function (index, row) {
        var studNo = $(this).find('td').eq(0).text();
        var examType = $('input[name=optradio]:checked').val();
        if (examType != "" && examType != undefined) {
            var apiPath = siteUrl +
                "/_api/lists/getbytitle('ILAC')/items?$select=Title,SpeakingTest,Result,ID&$filter=StudentNo eq '" + studNo +
                "' and ExamType eq '" + examType + "'";
            RestApiGet(apiPath).done(function (results) {
                if (results.length > 0) {
                    $("#tBodyILAC tr:nth-child(" + (index + 1) + ")").find('td input').eq(0).val(results[0].Title);
                    $("#tBodyILAC tr:nth-child(" + (index + 1) + ")").find('td input').eq(1).val(results[0].SpeakingTest);
                    $("#tBodyILAC tr:nth-child(" + (index + 1) + ")").find('td').eq(6).text(results[0].Result);
                    $("#tBodyILAC tr:nth-child(" + (index + 1) + ")").attr("data-id", results[0].ID);
                }
            });
        }

    });
    $("#tBodyCPE > tr").each(function (index, row) {
        var studNo = $(this).find('td').eq(0).text();
        var examType = $('input[name=optradio]:checked').val();
        if (examType != "" && examType != undefined) {
            var apiPath = siteUrl +
                "/_api/lists/getbytitle('CPE')/items?$select=Title,Listening,WritingPT1,WritingPT2,ExamResult,ID&$filter=StudentNo eq '" + studNo +
                "' and ExamType eq '" + examType + "'";
            RestApiGet(apiPath).done(function (results) {
                if (results.length > 0) {
                    $("#tBodyCPE tr:nth-child(" + (index + 1) + ")").find('td input').eq(0).val(results[0].Title);
                    $("#tBodyCPE tr:nth-child(" + (index + 1) + ")").find('td input').eq(1).val(results[0].Listening);
                    $("#tBodyCPE tr:nth-child(" + (index + 1) + ")").find('td input').eq(2).val(results[0].WritingPT1);
                    $("#tBodyCPE tr:nth-child(" + (index + 1) + ")").find('td input').eq(3).val(results[0].WritingPT2);
                    $("#tBodyCPE tr:nth-child(" + (index + 1) + ")").find('td').eq(8).text(results[0].ExamResult);
                    $("#tBodyCPE tr:nth-child(" + (index + 1) + ")").attr("data-id", results[0].ID);
                }
            });
        }
    });
    $("#tBodyTOFEL > tr").each(function (index, row) {
        var studNo = $(this).find('td').eq(0).text();
        var examType = $('input[name=optradio]:checked').val();
        if (examType != "" && examType != undefined) {
            var apiPath = siteUrl +
                "/_api/lists/getbytitle('TOFEL')/items?$select=Title,Reading,Listening,ExamResult,ID&$filter=StudentNo eq '" + studNo +
                "' and ExamType eq '" + examType + "'";
            RestApiGet(apiPath).done(function (results) {
                if (results.length > 0) {
                    $("#tBodyTOFEL tr:nth-child(" + (index + 1) + ")").find('td input').eq(0).val(results[0].Title);
                    $("#tBodyTOFEL tr:nth-child(" + (index + 1) + ")").find('td input').eq(1).val(results[0].Reading);
                    $("#tBodyTOFEL tr:nth-child(" + (index + 1) + ")").find('td input').eq(2).val(results[0].Listening);
                    $("#tBodyTOFEL tr:nth-child(" + (index + 1) + ")").find('td').eq(7).text(results[0].ExamResult);
                    $("#tBodyTOFEL tr:nth-child(" + (index + 1) + ")").attr("data-id", results[0].ID);
                }
            });
        }
    });
    $("#tBodyILETS > tr").each(function (index, row) {
        var studNo = $(this).find('td').eq(0).text();
        var examType = $('input[name=optradio]:checked').val();
        if (examType != "" && examType != undefined) {
            var apiPath = siteUrl +
                "/_api/lists/getbytitle('IELTS')/items?$select=Title,WritingPart2,Listening,Reading,ExamResult,ID&$filter=StudentNo eq '" + studNo +
                "' and ExamType eq '" + examType + "'";
            RestApiGet(apiPath).done(function (results) {
                if (results.length > 0) {
                    $("#tBodyILETS tr:nth-child(" + (index + 1) + ")").find('td input').eq(0).val(results[0].Title);
                    $("#tBodyILETS tr:nth-child(" + (index + 1) + ")").find('td input').eq(1).val(results[0].WritingPart2);
                    $("#tBodyILETS tr:nth-child(" + (index + 1) + ")").find('td input').eq(2).val(results[0].Listening);
                    $("#tBodyILETS tr:nth-child(" + (index + 1) + ")").find('td input').eq(3).val(results[0].Reading);
                    $("#tBodyILETS tr:nth-child(" + (index + 1) + ")").find('td').eq(8).text(results[0].ExamResult);
                    $("#tBodyILETS tr:nth-child(" + (index + 1) + ")").attr("data-id", results[0].ID);
                }
            });
        }
    });
    $("#tBodyKET > tr").each(function (index, row) {
        var studNo = $(this).find('td').eq(0).text();
        var examType = $('input[name=optradio]:checked').val();
        if (examType != "" && examType != undefined) {
            var apiPath = siteUrl +
                "/_api/lists/getbytitle('KET')/items?$select=Title,CourseworkWriting,CourseworkClassWork,CourseworkResult,ExamReading_x0026_Writing,ExamListening,ExamResult,ID&$filter=StudentNo eq '" + studNo +
                "' and ExamType eq '" + examType + "'";
            RestApiGet(apiPath).done(function (results) {
                if (results.length > 0) {
                    $("#tBodyKET tr:nth-child(" + (index + 1) + ")").find('td input').eq(0).val(results[0].Title);
                    $("#tBodyKET tr:nth-child(" + (index + 1) + ")").find('td input').eq(1).val(results[0].CourseworkWriting);
                    $("#tBodyKET tr:nth-child(" + (index + 1) + ")").find('td input').eq(2).val(results[0].CourseworkClassWork);
                    $("#tBodyKET tr:nth-child(" + (index + 1) + ")").find('td').eq(7).text(results[0].CourseworkResult);
                    $("#tBodyKET tr:nth-child(" + (index + 1) + ")").find('td input').eq(3).val(results[0].ExamReading_x0026_Writing);
                    $("#tBodyKET tr:nth-child(" + (index + 1) + ")").find('td input').eq(4).val(results[0].ExamListening);
                    $("#tBodyKET tr:nth-child(" + (index + 1) + ")").find('td').eq(10).text(results[0].ExamResult);
                    $("#tBodyKET tr:nth-child(" + (index + 1) + ")").attr("data-id", results[0].ID);
                }
            });
        }
    });
    $("#tBodyPET > tr").each(function (index, row) {
        var studNo = $(this).find('td').eq(0).text();
        var examType = $('input[name=optradio]:checked').val();
        if (examType != "" && examType != undefined) {
            var apiPath = siteUrl +
                "/_api/lists/getbytitle('PET')/items?$select=Title,CourseworkWriting,CourseworkClassWork,CourseworkResult,ExamReadingandWriting,ExamListening,ExamResult,ID&$filter=StudentNo eq '" + studNo +
                "' and ExamType eq '" + examType + "'";
            RestApiGet(apiPath).done(function (results) {
                if (results.length > 0) {
                    $("#tBodyPET tr:nth-child(" + (index + 1) + ")").find('td input').eq(0).val(results[0].Title);
                    $("#tBodyPET tr:nth-child(" + (index + 1) + ")").find('td input').eq(1).val(results[0].CourseworkWriting);
                    $("#tBodyPET tr:nth-child(" + (index + 1) + ")").find('td input').eq(2).val(results[0].CourseworkClassWork);
                    $("#tBodyPET tr:nth-child(" + (index + 1) + ")").find('td').eq(7).text(results[0].CourseworkResult);
                    $("#tBodyPET tr:nth-child(" + (index + 1) + ")").find('td input').eq(3).val(results[0].ExamReadingandWriting);
                    $("#tBodyPET tr:nth-child(" + (index + 1) + ")").find('td input').eq(4).val(results[0].ExamListening);
                    $("#tBodyPET tr:nth-child(" + (index + 1) + ")").find('td').eq(10).text(results[0].ExamResult);
                    $("#tBodyPET tr:nth-child(" + (index + 1) + ")").attr("data-id", results[0].ID);
                }
            });
        }
    });
    $("#tBodyFCE > tr").each(function (index, row) {
        var studNo = $(this).find('td').eq(0).text();
        var examType = $('input[name=optradio]:checked').val();
        if (examType != "" && examType != undefined) {
            var apiPath = siteUrl +
                "/_api/lists/getbytitle('FCE')/items?$select=Title,CourseworkWriting,CourseworkClassWork,CourseworkResult,ExamReadingandWriting,ExamListening,ExamResult,ID&$filter=StudentNo eq '" + studNo +
                "' and ExamType eq '" + examType + "'";
            RestApiGet(apiPath).done(function (results) {
                if (results.length > 0) {
                    $("#tBodyFCE tr:nth-child(" + (index + 1) + ")").find('td input').eq(0).val(results[0].Title);
                    $("#tBodyFCE tr:nth-child(" + (index + 1) + ")").find('td input').eq(1).val(results[0].CourseworkWriting);
                    $("#tBodyFCE tr:nth-child(" + (index + 1) + ")").find('td input').eq(2).val(results[0].CourseworkClassWork);
                    $("#tBodyFCE tr:nth-child(" + (index + 1) + ")").find('td').eq(7).text(results[0].CourseworkResult);
                    $("#tBodyFCE tr:nth-child(" + (index + 1) + ")").find('td input').eq(3).val(results[0].ExamReadingandWriting);
                    $("#tBodyFCE tr:nth-child(" + (index + 1) + ")").find('td input').eq(4).val(results[0].ExamListening);
                    $("#tBodyFCE tr:nth-child(" + (index + 1) + ")").find('td').eq(10).text(results[0].ExamResult);
                    $("#tBodyFCE tr:nth-child(" + (index + 1) + ")").attr("data-id", results[0].ID);
                }
            });
        }
    });
    $("#tBodyCAE > tr").each(function (index, row) {
        var studNo = $(this).find('td').eq(0).text();
        var examType = $('input[name=optradio]:checked').val();
        if (examType != "" && examType != undefined) {
            var apiPath = siteUrl +
                "/_api/lists/getbytitle('CAE')/items?$select=Title,CourseworkWriting,CourseworkClassWork,CourseworkResult,ExamReadingandWriting,ExamListening,ExamResult,ID&$filter=StudentNo eq '" + studNo +
                "' and ExamType eq '" + examType + "'";
            RestApiGet(apiPath).done(function (results) {
                if (results.length > 0) {
                    $("#tBodyCAE tr:nth-child(" + (index + 1) + ")").find('td input').eq(0).val(results[0].Title);
                    $("#tBodyCAE tr:nth-child(" + (index + 1) + ")").find('td input').eq(1).val(results[0].CourseworkWriting);
                    $("#tBodyCAE tr:nth-child(" + (index + 1) + ")").find('td input').eq(2).val(results[0].CourseworkClassWork);
                    $("#tBodyCAE tr:nth-child(" + (index + 1) + ")").find('td').eq(7).text(results[0].CourseworkResult);
                    $("#tBodyCAE tr:nth-child(" + (index + 1) + ")").find('td input').eq(3).val(results[0].ExamReadingandWriting);
                    $("#tBodyCAE tr:nth-child(" + (index + 1) + ")").find('td input').eq(4).val(results[0].ExamListening);
                    $("#tBodyCAE tr:nth-child(" + (index + 1) + ")").find('td').eq(10).text(results[0].ExamResult);
                    $("#tBodyCAE tr:nth-child(" + (index + 1) + ")").attr("data-id", results[0].ID);
                }
            });
        }
    });
    $("#tBodyBECL > tr").each(function (index, row) {
        var studNo = $(this).find('td').eq(0).text();
        var examType = $('input[name=optradio]:checked').val();
        if (examType != "" && examType != undefined) {
            var apiPath = siteUrl +
                "/_api/lists/getbytitle('BEC Lower')/items?$select=Title,CourseworkWriting,CourseworkClassWork,CourseworkResult,ExamReadingandWriting,ExamListening,ExamResult,ID&$filter=StudentNo eq '" + studNo +
                "' and ExamType eq '" + examType + "'";
            RestApiGet(apiPath).done(function (results) {
                if (results.length > 0) {
                    $("#tBodyBECL tr:nth-child(" + (index + 1) + ")").find('td input').eq(0).val(results[0].Title);
                    $("#tBodyBECL tr:nth-child(" + (index + 1) + ")").find('td input').eq(1).val(results[0].CourseworkWriting);
                    $("#tBodyBECL tr:nth-child(" + (index + 1) + ")").find('td input').eq(2).val(results[0].CourseworkClassWork);
                    $("#tBodyBECL tr:nth-child(" + (index + 1) + ")").find('td').eq(6).text(results[0].CourseworkResult);
                    $("#tBodyBECL tr:nth-child(" + (index + 1) + ")").find('td input').eq(3).val(results[0].ExamReadingandWriting);
                    $("#tBodyBECL tr:nth-child(" + (index + 1) + ")").find('td input').eq(4).val(results[0].ExamListening);
                    $("#tBodyBECL tr:nth-child(" + (index + 1) + ")").find('td').eq(10).text(results[0].ExamResult);
                    $("#tBodyBECL tr:nth-child(" + (index + 1) + ")").attr("data-id", results[0].ID);
                }
            });
        }
    });
    $("#tBodyBECH > tr").each(function (index, row) {
        var studNo = $(this).find('td').eq(0).text();
        var examType = $('input[name=optradio]:checked').val();
        if (examType != "" && examType != undefined) {
            var apiPath = siteUrl +
                "/_api/lists/getbytitle('BEC Higher')/items?$select=Title,CourseworkWriting0,CourseworkClassWork,CourseworkResult,ExamReadingandWriting,ExamListening,ExamResult,ID&$filter=StudentNo eq '" + studNo +
                "' and ExamType eq '" + examType + "'";
            RestApiGet(apiPath).done(function (results) {
                if (results.length > 0) {
                    $("#tBodyBECH tr:nth-child(" + (index + 1) + ")").find('td input').eq(0).val(results[0].Title);
                    $("#tBodyBECH tr:nth-child(" + (index + 1) + ")").find('td input').eq(1).val(results[0].CourseworkWriting0);
                    $("#tBodyBECH tr:nth-child(" + (index + 1) + ")").find('td input').eq(2).val(results[0].CourseworkClassWork);
                    $("#tBodyBECH tr:nth-child(" + (index + 1) + ")").find('td').eq(6).text(results[0].CourseworkResult);
                    $("#tBodyBECH tr:nth-child(" + (index + 1) + ")").find('td input').eq(3).val(results[0].ExamReadingandWriting);
                    $("#tBodyBECH tr:nth-child(" + (index + 1) + ")").find('td input').eq(4).val(results[0].ExamListening);
                    $("#tBodyBECH tr:nth-child(" + (index + 1) + ")").find('td').eq(10).text(results[0].ExamResult);
                    $("#tBodyBECH tr:nth-child(" + (index + 1) + ")").attr("data-id", results[0].ID);
                }
            });
        }
    });
    $("#tBodyPTOFEL > tr").each(function (index, row) {
        var studNo = $(this).find('td').eq(0).text();
        var examType = $('input[name=optradio]:checked').val();
        if (examType != "" && examType != undefined) {
            var apiPath = siteUrl +
                "/_api/lists/getbytitle('PTOFEL')/items?$select=*&$filter=StudentNo eq '" + studNo +
                "' and ExamType eq '" + examType + "'";
            debugger;
            RestApiGet(apiPath).done(function (results) {
                if (results.length > 0) {
                    $("#tBodyPTOFEL tr:nth-child(" + (index + 1) + ")").find('td input').eq(0).val(results[0].Title);
                    $("#tBodyPTOFEL tr:nth-child(" + (index + 1) + ")").find('td input').eq(1).val(results[0].Quiz1);
                    $("#tBodyPTOFEL tr:nth-child(" + (index + 1) + ")").find('td input').eq(2).val(results[0].Quiz2);
                    $("#tBodyPTOFEL tr:nth-child(" + (index + 1) + ")").find('td input').eq(3).val(results[0].InClassWriting);
                    $("#tBodyPTOFEL tr:nth-child(" + (index + 1) + ")").find('td input').eq(4).val(results[0].ParticipationHW34);
                    $("#tBodyPTOFEL tr:nth-child(" + (index + 1) + ")").find('td input').eq(5).val(results[0].LongEssayOutline);
                    $("#tBodyPTOFEL tr:nth-child(" + (index + 1) + ")").find('td input').eq(6).val(results[0].Quiz3);
                    $("#tBodyPTOFEL tr:nth-child(" + (index + 1) + ")").find('td input').eq(7).val(results[0].DraftProcess);
                    $("#tBodyPTOFEL tr:nth-child(" + (index + 1) + ")").find('td input').eq(8).val(results[0].ResearchPresentation);
                    $("#tBodyPTOFEL tr:nth-child(" + (index + 1) + ")").find('td input').eq(9).val(results[0].OData__x0053_P1);
                    $("#tBodyPTOFEL tr:nth-child(" + (index + 1) + ")").find('td input').eq(10).val(results[0].OData__x0053_P2);
                    $("#tBodyPTOFEL tr:nth-child(" + (index + 1) + ")").find('td input').eq(11).val(results[0].OData__x0053_P1);
                    $("#tBodyPTOFEL tr:nth-child(" + (index + 1) + ")").find('td input').eq(12).val(results[0].FinalLongEssay);
                    $("#tBodyPTOFEL tr:nth-child(" + (index + 1) + ")").find('td').eq(17).text(results[0].TERMSCORE);
                    $("#tBodyPTOFEL tr:nth-child(" + (index + 1) + ")").find('td input').eq(13).val(results[0].Writing);
                    $("#tBodyPTOFEL tr:nth-child(" + (index + 1) + ")").find('td input').eq(14).val(results[0].Reading);
                    $("#tBodyPTOFEL tr:nth-child(" + (index + 1) + ")").find('td input').eq(15).val(results[0].Listening);
                    $("#tBodyPTOFEL tr:nth-child(" + (index + 1) + ")").find('td').eq(21).text(results[0].Converted);
                    $("#tBodyPTOFEL tr:nth-child(" + (index + 1) + ")").attr("data-id", results[0].ID);
                }
            });
        }
    });
    $("#tBodyPIIITOFEL > tr").each(function (index, row) {
        var studNo = $(this).find('td').eq(0).text();
        var examType = $('input[name=optradio]:checked').val();
        if (examType != "" && examType != undefined) {
            var apiPath = siteUrl +
                "/_api/lists/getbytitle('PIIITOFEL')/items?$select=*&$filter=StudentNo eq '" + studNo +
                "' and ExamType eq '" + examType + "'";
            RestApiGet(apiPath).done(function (results) {
                if (results.length > 0) {
                    $("#tBodyPIIITOFEL tr:nth-child(" + (index + 1) + ")").find('td input').eq(0).val(results[0].Title);
                    $("#tBodyPIIITOFEL tr:nth-child(" + (index + 1) + ")").find('td input').eq(1).val(results[0].Quiz1);
                    $("#tBodyPIIITOFEL tr:nth-child(" + (index + 1) + ")").find('td input').eq(2).val(results[0].Quiz2);
                    $("#tBodyPIIITOFEL tr:nth-child(" + (index + 1) + ")").find('td input').eq(3).val(results[0].InClassWriting);
                    $("#tBodyPIIITOFEL tr:nth-child(" + (index + 1) + ")").find('td input').eq(4).val(results[0].LongEssayOutline);
                    $("#tBodyPIIITOFEL tr:nth-child(" + (index + 1) + ")").find('td input').eq(5).val(results[0].Quiz3);
                    $("#tBodyPIIITOFEL tr:nth-child(" + (index + 1) + ")").find('td input').eq(6).val(results[0].DraftProcess);
                    $("#tBodyPIIITOFEL tr:nth-child(" + (index + 1) + ")").find('td input').eq(7).val(results[0].ResearchPresentation);
                    $("#tBodyPIIITOFEL tr:nth-child(" + (index + 1) + ")").find('td input').eq(8).val(results[0].OData__x0053_P1);
                    $("#tBodyPIIITOFEL tr:nth-child(" + (index + 1) + ")").find('td input').eq(9).val(results[0].OData__x0053_P2);
                    $("#tBodyPIIITOFEL tr:nth-child(" + (index + 1) + ")").find('td input').eq(10).val(results[0].OData__x0053_P3);
                    $("#tBodyPIIITOFEL tr:nth-child(" + (index + 1) + ")").find('td input').eq(11).val(results[0].FinalLongEssay);
                    $("#tBodyPIIITOFEL tr:nth-child(" + (index + 1) + ")").find('td').eq(16).text(results[0].TermScore);
                    $("#tBodyPIIITOFEL tr:nth-child(" + (index + 1) + ")").find('td input').eq(12).val(results[0].Writing);
                    $("#tBodyPIIITOFEL tr:nth-child(" + (index + 1) + ")").find('td input').eq(13).val(results[0].Reading);
                    $("#tBodyPIIITOFEL tr:nth-child(" + (index + 1) + ")").find('td input').eq(14).val(results[0].Listening);
                    $("#tBodyPIIITOFEL tr:nth-child(" + (index + 1) + ")").find('td').eq(20).text(results[0].Converted);
                    $("#tBodyPIIITOFEL tr:nth-child(" + (index + 1) + ")").attr("data-id", results[0].ID);
                }
            });
        }
    });
}

function bindOuterHtml(currentExam) {
    var mainDiv = document.getElementById('mainContainer');
    switch (currentExam) {
        case examTypes["ILAC"]:
            var headerDiv = `<div class="container-fluid widthAuto">
                <table class="table table-bordered table-condensed">
                    <thead>
                        <tr>
                            <th>Student ID</th>
                            <th>Name</th>
                            <th>Exam</th>
                            <th>Level</th>
                            <th>Paper Test</th>
                            <th>Speaking</th>
                            <th>Result</th>
                        </tr>
                    </thead>
                    <tbody id="tBodyILAC">
                    </tbody>
                </table>
                </div>`;
            mainDiv.innerHTML += headerDiv;
            break;
        case examTypes["CPE"]:
            var headerDiv = `<div class="container-fluid widthAuto">
                    <table class="table table-bordered table-condensed">
                        <thead>
                            <tr>
                                <th>Student ID</th>
                                <th>Name</th>
                                <th>Exam</th>
                                <th>Level</th>
                                <th>R&UOE</th>
                                <th>Listening</th>
                                <th>Writing PT1</th>
                                <th>Writing PT2</th>
                                <th>Exam Result</th>
                            </tr>
                        </thead>
                        <tbody id="tBody`+ examTypes["CPE"] + `">
                        </tbody>
                    </table>
                </div>`;
            mainDiv.innerHTML += headerDiv;
            break;
        case examTypes["TOFEL"]:
            var headerDiv = `<div class="container-fluid widthAuto">
                <table class="table table-bordered table-condensed">
                    <thead>
                        <tr>
                            <th>Student ID</th>
                            <th>Name</th>
                            <th>Exam</th>
                            <th>Level</th>
                            <th>Writing</th>
                            <th>Reading</th>
                            <th>Listening</th>
                            <th>Exam Result</th>
                        </tr>
                    </thead>
                    <tbody id="tBody`+ examTypes["TOFEL"] + `">
                    </tbody>
                    </table>
                </div>`;
            mainDiv.innerHTML += headerDiv;
            break;
        case examTypes["ILETS"]:
            var headerDiv = `<div class="container-fluid widthAuto">
                <table class="table table-bordered table-condensed">
                    <thead>
                        <tr>
                            <th>Student ID</th>
                            <th>Name</th>
                            <th>Exam</th>
                            <th>Level</th>
                            <th>Writing Part 1</th>
                            <th>Writing Part 2</th>
                            <th>Listening</th>
                            <th>Reading</th>
                            <th>Exam Result</th>
                        </tr>
                    </thead>
                    <tbody id="tBody`+ examTypes["ILETS"] + `">
                    </tbody>
                    </table>
                </div>`;
            mainDiv.innerHTML += headerDiv;
            break;
        case examTypes["KET"]:
            var headerDiv = `<div class="container-fluid widthAuto">
                    <table class="table table-bordered table-condensed">
                        <thead>
                            <tr>
                                <th>Student ID</th>
                                <th>Name</th>
                                <th>Exam</th>
                                <th>Level</th>
                                <th>Coursework Speaking</th>
                                <th>Coursework Writing</th>
                                <th>Coursework ClassWork</th>
                                <th>Coursework Result</th>
                                <th>Exam Reading and Writing</th>
                                <th>Exam Listening</th>
                                <th>Exam Result</th>
                            </tr>
                        </thead>
                        <tbody id="tBody`+ examTypes["KET"] + `">
                    </tbody>
                    </table>
                </div>`;
            mainDiv.innerHTML += headerDiv;
            break;
        case examTypes["PET"]:
            var headerDiv = `<div class="container-fluid widthAuto">
                        <table class="table table-bordered table-condensed">
                            <thead>
                                <tr>
                                    <th>Student ID</th>
                                    <th>Name</th>
                                    <th>Exam</th>
                                    <th>Level</th>
                                    <th>Coursework Speaking</th>
                                    <th>Coursework Writing</th>
                                    <th>Coursework ClassWork</th>
                                    <th>Coursework Result</th>
                                    <th>Exam Reading and Writing</th>
                                    <th>Exam Listening</th>
                                    <th>Exam Result</th>
                                </tr>
                            </thead>
                            <tbody id="tBody`+ examTypes["PET"] + `">
                        </tbody>
                        </table>
                    </div>`;
            mainDiv.innerHTML += headerDiv;
            break;
        case examTypes["FCE"]:
            var headerDiv = `<div class="container-fluid widthAuto">
                    <table class="table table-bordered table-condensed">
                        <thead>
                            <tr>
                                <th>Student ID</th>
                                <th>Name</th>
                                <th>Exam</th>
                                <th>Level</th>
                                <th>Coursework Speaking</th>
                                <th>Coursework Writing</th>
                                <th>Coursework ClassWork</th>
                                <th>Coursework Result</th>
                                <th>Exam Listening</th>
                                <th>Exam Reading and Use of English</th>
                                <th>Exam Result</th>
                            </tr>
                            </thead>
                            <tbody id="tBody`+ examTypes["FCE"] + `">
                        </tbody>
                        </table>
                        </div>`;
            mainDiv.innerHTML += headerDiv;
            break;
        case examTypes["CAE"]:
            var headerDiv = `<div class="container-fluid widthAuto">
                        <table class="table table-bordered table-condensed">
                            <thead>
                                <tr>
                                    <th>Student ID</th>
                                    <th>Name</th>
                                    <th>Exam</th>
                                    <th>Level</th>
                                    <th>Coursework Speaking</th>
                                    <th>Coursework Writing</th>
                                    <th>Coursework ClassWork</th>
                                    <th>Coursework Result</th>
                                    <th>Exam Listening</th>
                                    <th>Exam Reading and Use of English</th>
                                    <th>Exam Result</th>
                                </tr>
                            </thead>
                            <tbody id="tBody`+ examTypes["CAE"] + `">
                    </tbody>
                    </table>
                    </div>`;
            mainDiv.innerHTML += headerDiv;
            break;
        case examTypes["BECL"]:
            var headerDiv = `<div class="container-fluid widthAuto">
                            <table class="table table-bordered table-condensed">
                                <thead>
                                    <tr>
                                        <th>Student ID</th>
                                        <th>Name</th>
                                        <th>Exam</th>
                                        <th>Level</th>
                                        <th>Coursework Presentation</th>
                                        <th>Coursework Assignment</th>
                                        <th>Coursework Result</th>
                                        <th>Exam Reading</th>
                                        <th>Exam Listening</th>
                                        <th>Exam Writing</th>
                                        <th>Exam Result</th>
                                    </tr>
                                </thead>
                                <tbody id="tBodyBECL">
                        </tbody>
                        </table>
                        </div>`;
            mainDiv.innerHTML += headerDiv;
            break;
        case examTypes["BECH"]:
            var headerDiv = `<div class="container-fluid widthAuto">
                        <table class="table table-bordered table-condensed">
                            <thead>
                                <tr>
                                    <th>Student ID</th>
                                    <th>Name</th>
                                    <th>Exam</th>
                                    <th>Level</th>
                                    <th>Coursework Presentation</th>
                                    <th>Coursework Assignment</th>
                                    <th>Coursework Result</th>
                                    <th>Exam Reading</th>
                                    <th>Exam Listening</th>
                                    <th>Exam Writing</th>
                                    <th>Exam Result</th>
                                </tr>
                            </thead>
                            <tbody id="tBodyBECH">
                        </tbody>
                        </table>
                        </div>`;
            mainDiv.innerHTML += headerDiv;
            break;
        case examTypes["PTOFEL"]:
            var headerDiv = `<div class="container-fluid widthAuto">
                        <table class="table table-bordered table-condensed">
                            <thead>
                                <tr>
                                    <th>Student ID</th>
                                    <th>Name</th>
                                    <th>Exam</th>
                                    <th>Level</th>
                                    <th>Participation / HW W1-2</th>
                                    <th>Quiz # 1</th>
                                    <th>Quiz # 2</th>
                                    <th>In-Class Writing</th>
                                    <th>Participation / HW W3-4</th>
                                    <th>Long Essay Outline</th>
                                    <th>Quiz # 3</th>
                                    <th>Draft Process</th>
                                    <th>Research Presentation</th>
                                    <th>SP1</th>
                                    <th>SP2</th>
                                    <th>SP3</th>
                                    <th>Final Long Essay</th>
                                    <th>TERM SCORE</th>
                                    <th>Writing</th>
                                    <th>Reading</th>
                                    <th>Listening</th>
                                    <th>Converted</th>
                                </tr>
                            </thead>
                            <tbody id="tBodyPTOFEL">
                        </tbody>
                        </table>
                        </div>`;
            mainDiv.innerHTML += headerDiv;
            break;
        case examTypes["PIIITOFEL"]:
            var headerDiv = `<div class="container-fluid widthAuto" >
                        <table class="table table-bordered table-condensed">
                            <thead>
                                <tr>
                                    <th>Student ID</th>
                                    <th>Name</th>
                                    <th>Exam</th>
                                    <th>Level</th>
                                    <th>Participation / HW</th>
                                    <th>Quiz # 1</th>
                                    <th>Quiz # 2</th>
                                    <th>In-Class Writing</th>
                                    <th>Long Essay Outline</th>
                                    <th>Quiz # 3</th>
                                    <th>Draft Process</th>
                                    <th>Research Presentation</th>
                                    <th>SP1</th>
                                    <th>SP2</th>
                                    <th>SP3</th>
                                    <th>Final Long Essay</th>
                                    <th>TERM SCORE</th>
                                    <th>Writing</th>
                                    <th>Reading</th>
                                    <th>Listening</th>
                                    <th>Converted</th>
                                </tr>
                            </thead>
                            <tbody id="tBodyPIIITOFEL">
                        </tbody>
                        </table>
                        </div>`;
            mainDiv.innerHTML += headerDiv;
            break;
        default:
            var headerDiv = `<div class="container-fluid">
                        <table class="table table-bordered table-condensed">
                            <thead>
                                <tr>
                                    <th>No Records Found</th>
                               </tr>
                            </thead>
                    </table>
                    </div>`;
            mainDiv.innerHTML += headerDiv;
            close();
            break;
    }
}

function filterArray(principalData) {
    var result = $.grep(ExamTypeArray, function (e, val) { return e.Title == principalData });
    if (result.length > 0) {
        return result[0].ProficiencyTest;
    } else {
        return "undefined";
    }
}

function filterStudArray(Principal) {
    var result = $.grep(studArray, function (e, val) { return e.PrincipalVal == Principal });
    if (result.length > 0) {
        return result;
    } else {
        return 0;
    }
}

function bindInnerHtml(currentExam) {
    switch (currentExam) {
        case examTypes["ILAC"]:
            {
                studArray.forEach(element => {

                    if (element.examType == examTypes["ILAC"]) {
                        var div = document.getElementById("tBodyILAC");
                        var rowDiv = `<tr data-id="0">
                                            <td class="sid">`+ element.StudNo + `</td>
                                            <td class="sname">`+ element.Name + `</td>
                                            <td class="exam">`+ currentExam + `</td>
                                            <td class="level">`+ element.Level + `</td>
                                            <td class="edit"><input class="form-control input-sm ilacinput" min="1" max="60" type="number"></td>
                                            <td class="edit"><input class="form-control input-sm ilacinput" min="1" max="40" type="number"></td>
                                            <td></td>
                                            </tr>`;
                        div.innerHTML += rowDiv;
                    }

                });
            }
            break;
        case examTypes["CPE"]:
            {
                studArray.forEach(element => {
                    if (element.examType == examTypes["CPE"]) {
                        var div = document.getElementById("tBody" + examTypes["CPE"]);
                        var rowDiv = `<tr data-id="0">
                                        <td class="sid">`+ element.StudNo + `</td>
                                        <td class="sname">`+ element.Name + `</td>
                                        <td class="exam">`+ currentExam + `</td>
                                        <td class="level">`+ element.Level + `</td>
                                        <td><input class="form-control input-sm cpeinput" min="1" max="72" type="number"></td>
                                        <td><input class="form-control input-sm cpeinput" min="1" max="30" type="number"></td>
                                        <td><input class="form-control input-sm cpeinput" min="1" max="20" type="number"></td>
                                        <td><input class="form-control input-sm cpeinput" min="1" max="20" type="number"></td>
                                        <td></td>
                                    </tr>`;
                        div.innerHTML += rowDiv;
                    }
                });
            }
            break;
        case examTypes["TOFEL"]:
            {
                studArray.forEach(element => {

                    if (element.examType == examTypes["TOFEL"]) {
                        var div = document.getElementById("tBody" + examTypes["TOFEL"]);
                        var rowDiv = `<tr data-id="0">
                                        <td class="sid">`+ element.StudNo + `</td>
                                        <td class="sname">`+ element.Name + `</td>
                                        <td class="exam">`+ currentExam + `</td>
                                        <td class="level">`+ element.Level + `</td>
                                        <td><input class="form-control input-sm tofelinput" min="1" max="10" id="inputsm" type="number"></td>
                                        <td><input class="form-control input-sm tofelinput" min="1" max="42" id="inputsm" type="number"></td>
                                        <td><input class="form-control input-sm tofelinput" min="1" max="34" id="inputsm" type="number"></td>
                                        <td></td>
                                        </tr>`;
                        div.innerHTML += rowDiv;
                    }
                });
            }
            break;
        case examTypes["ILETS"]:
            {
                studArray.forEach(element => {
                    if (element.examType == examTypes["ILETS"]) {
                        var div = document.getElementById("tBody" + examTypes["ILETS"]);
                        var rowDiv = `<tr data-id="0">
                                        <td class="sid">`+ element.StudNo + `</td>
                                        <td class="sname">`+ element.Name + `</td>
                                        <td class="exam">`+ currentExam + `</td>
                                        <td class="level">`+ element.Level + `</td>
                                        <td><input class="form-control input-sm iletsinput" min="1" max="40" id="inputsm" type="number"></td>
                                        <td><input class="form-control input-sm iletsinput" min="1" max="40" id="inputsm" type="number"></td>
                                        <td><input class="form-control input-sm iletsinput" min="1" max="40" id="inputsm" type="number"></td>
                                        <td><input class="form-control input-sm iletsinput" min="1" max="40" id="inputsm" type="number"></td>
                                        <td></td>
                                        </tr>`;
                        div.innerHTML += rowDiv;
                    }
                });
            }
            break;
        case examTypes["KET"]:
            {
                studArray.forEach(element => {
                    if (element.examType == examTypes["KET"]) {
                        var div = document.getElementById("tBody" + examTypes["KET"]);
                        var rowDiv = `<tr data-id="0">
                                        <td class="sid">`+ element.StudNo + `</td>
                                        <td class="sname">`+ element.Name + `</td>
                                        <td class="exam">`+ currentExam + `</td>
                                        <td class="level">`+ element.Level + `</td>
                                        <td><input class="form-control input-sm ketinput" min="1" max="25" id="inputsm" type="number"></td>
                                        <td><input class="form-control input-sm ketinput" min="1" max="25" id="inputsm" type="number"></td>
                                        <td><input class="form-control input-sm ketinput" min="1" max="50" id="inputsm" type="number"></td>
                                        <td></td>
                                        <td><input class="form-control input-sm ketinput" min="1" max="55" id="inputsm" type="number"></td>
                                        <td><input class="form-control input-sm ketinput" min="1" max="25" id="inputsm" type="number"></td>
                                        <td></td>
                                        </tr>`;
                        div.innerHTML += rowDiv;
                    }
                });
            }
            break;
        case examTypes["PET"]:
            {
                studArray.forEach(element => {
                    if (element.examType == examTypes["PET"]) {
                        var div = document.getElementById("tBody" + examTypes["PET"]);
                        var rowDiv = `<tr data-id="0">
                                            <td class="sid">`+ element.StudNo + `</td>
                                            <td class="sname">`+ element.Name + `</td>
                                            <td class="exam">`+ currentExam + `</td>
                                            <td class="level">`+ element.Level + `</td>
                                            <td><input class="form-control input-sm petinput" min="1" max="25" id="inputsm" type="number"></td>
                                            <td><input class="form-control input-sm petinput" min="1" max="25" id="inputsm" type="number"></td>
                                            <td><input class="form-control input-sm petinput" min="1" max="50" id="inputsm" type="number"></td>
                                            <td></td>
                                            <td><input class="form-control input-sm petinput" min="1" max="40" id="inputsm" type="number"></td>
                                            <td><input class="form-control input-sm petinput" min="1" max="25" id="inputsm" type="number"></td>
                                            <td></td>
                                            </tr>`;
                        div.innerHTML += rowDiv;
                    }
                });
            }
            break;
        case examTypes["FCE"]:
            {
                studArray.forEach(element => {
                    try {
                        if (element.examType == examTypes["FCE"]) {
                            var div = document.getElementById("tBody" + examTypes["FCE"]);
                            var rowDiv = `<tr data-id="0">
                                            <td class="sid">`+ element.StudNo + `</td>
                                            <td class="sname">`+ element.Name + `</td>
                                            <td class="exam">`+ currentExam + `</td>
                                            <td class="level">`+ element.Level + `</td>
                                            <td><input class="form-control input-sm fceinput" min="1" max="25" id="inputsm" type="number"></td>
                                            <td><input class="form-control input-sm fceinput" min="1" max="25" id="inputsm" type="number"></td>
                                            <td><input class="form-control input-sm fceinput" min="1" max="50" id="inputsm" type="number"></td>
                                            <td></td>
                                            <td><input class="form-control input-sm fceinput" min="1" max="30" id="inputsm" type="number"></td>
                                            <td><input class="form-control input-sm fceinput" min="1" max="70" id="inputsm" type="number"></td>
                                            <td></td>
                                            </tr>`;
                            div.innerHTML += rowDiv;
                        }
                    } catch (Exception) {

                    }
                });
            }
            break;
        case examTypes["CAE"]:
            {
                studArray.forEach(element => {
                    try {
                        if (element.examType == examTypes["CAE"]) {
                            var div = document.getElementById("tBody" + examTypes["CAE"]);
                            var rowDiv = `<tr data-id="0">
                                            <td class="sid">`+ element.StudNo + `</td>
                                            <td class="sname">`+ element.Name + `</td>
                                            <td class="exam">`+ currentExam + `</td>
                                            <td class="level">`+ element.Level + `</td>
                                            <td><input class="form-control input-sm caeinput" min="1" max="25" id="inputsm" type="number"></td>
                                            <td><input class="form-control input-sm caeinput" min="1" max="25" id="inputsm" type="number"></td>
                                            <td><input class="form-control input-sm caeinput" min="1" max="50" id="inputsm" type="number"></td>
                                            <td></td>
                                            <td><input class="form-control input-sm caeinput" min="1" max="30" id="inputsm" type="number"></td>
                                            <td><input class="form-control input-sm caeinput" min="1" max="78" id="inputsm" type="number"></td>
                                            <td></td>
                                        </tr>`;
                            div.innerHTML += rowDiv;
                        }
                    } catch (Exception) {

                    }
                });
            }
            break;
        case examTypes["BECL"]:
            {
                studArray.forEach(element => {
                    if (element.examType == examTypes["BECL"]) {
                        var div = document.getElementById("tBodyBECL");
                        var rowDiv = `<tr data-id="0">
                                                <td class="sid">`+ element.StudNo + `</td>
                                                <td class="sname">`+ element.Name + `</td>
                                                <td class="exam">`+ currentExam + `</td>
                                                <td class="level">`+ element.Level + `</td>
                                                <td><input class="form-control input-sm beclinput" id="inputsm" min="1" max="60" type="number"></td>
                                                <td><input class="form-control input-sm beclinput" id="inputsm" min="1" max="40" type="number"></td>
                                                <td></td>
                                                <td><input class="form-control input-sm beclinput" id="inputsm" min="1" max="45" type="number"></td>
                                                <td><input class="form-control input-sm beclinput" id="inputsm" min="1" max="30" type="number"></td>
                                                <td><input class="form-control input-sm beclinput" id="inputsm" min="1" max="30" type="number"></td>
                                                <td></td>
                                            </tr>`;
                        div.innerHTML += rowDiv;
                    }
                });
            }
            break;
        case examTypes["BECH"]:
            {
                studArray.forEach(element => {
                    if (element.examType == examTypes["BECH"]) {
                        var div = document.getElementById("tBodyBECH");
                        var rowDiv = `<tr data-id="0">
                                            <td class="sid">`+ element.StudNo + `</td>
                                            <td class="sname">`+ element.Name + `</td>
                                            <td class="exam">`+ currentExam + `</td>
                                            <td class="level">`+ element.Level + `</td>
                                            <td><input class="form-control input-sm bechinput" id="inputsm" min="1" max="60" type="number"></td>
                                            <td><input class="form-control input-sm bechinput" id="inputsm" min="1" max="40" type="number"></td>
                                            <td></td>
                                            <td><input class="form-control input-sm bechinput" id="inputsm" min="1" max="52" type="number"></td>
                                            <td><input class="form-control input-sm bechinput" id="inputsm" min="1" max="30" type="number"></td>
                                            <td><input class="form-control input-sm bechinput" id="inputsm" min="1" max="30" type="number"></td>
                                            <td></td>
                                        </tr>`;
                        div.innerHTML += rowDiv;
                    }
                });
            }
            break;
        case examTypes["PTOFEL"]:
            {
                studArray.forEach(element => {
                    if (element.examType == examTypes["PTOFEL"]) {
                        var div = document.getElementById("tBodyPTOFEL");
                        var rowDiv = `<tr data-id="0">
                                            <td class="sid">`+ element.StudNo + `</td>
                                            <td class="sname">`+ element.Name + `</td>
                                            <td class="exam">`+ currentExam + `</td>
                                            <td class="level">`+ element.Level + `</td>
                                            <td><input class="form-control input-sm ptofelinput" id="inputsm" min="1" max="5" type="number"></td>
                                            <td><input class="form-control input-sm ptofelinput" id="inputsm" min="1" max="20" type="number"></td>
                                            <td><input class="form-control input-sm ptofelinput" id="inputsm" min="1" max="20" type="number"></td>
                                            <td><input class="form-control input-sm ptofelinput" id="inputsm" min="1" max="15" type="number"></td>
                                            <td><input class="form-control input-sm ptofelinput" id="inputsm" min="1" max="5" type="number"></td>
                                            <td><input class="form-control input-sm ptofelinput" id="inputsm" min="1" max="5" type="number"></td>
                                            <td><input class="form-control input-sm ptofelinput" id="inputsm" min="1" max="20" type="number"></td>
                                            <td><input class="form-control input-sm ptofelinput" id="inputsm" min="1" max="5" type="number"></td>
                                            <td><input class="form-control input-sm ptofelinput" id="inputsm" min="1" max="100" type="number"></td>
                                            <td><input class="form-control input-sm ptofelinput textboxminwidth" id="inputsm" min="1" max="25" type="number"></td>
                                            <td><input class="form-control input-sm ptofelinput textboxminwidth" id="inputsm" min="1" max="25" type="number"></td>
                                            <td><input class="form-control input-sm ptofelinput textboxminwidth" id="inputsm" min="1" max="25" type="number"></td>
                                            <td><input class="form-control input-sm ptofelinput" id="inputsm" min="1" max="100" type="number"></td>
                                            <td></td>
                                            <td><input class="form-control input-sm ptofelinput" id="inputsm" min="1" max="10" type="number"></td>
                                            <td><input class="form-control input-sm ptofelinput" id="inputsm" min="1" max="42" type="number"></td>
                                            <td><input class="form-control input-sm ptofelinput" id="inputsm" min="1" max="34" type="number"></td>
                                            <td></td>
                                        </tr>`;
                        div.innerHTML += rowDiv;
                    }
                });
            }
            break;
        case examTypes["PIIITOFEL"]:
            {
                studArray.forEach(element => {
                    if (element.examType == examTypes["PIIITOFEL"]) {
                        var div = document.getElementById("tBodyPIIITOFEL");
                        var rowDiv = `<tr data-id="0">
                                            <td class="sid">`+ element.StudNo + `</td>
                                            <td class="sname">`+ element.Name + `</td>
                                            <td class="exam">`+ currentExam + `</td>
                                            <td class="level">`+ element.Level + `</td>
                                            <td><input class="form-control input-sm pitofelinput" id="inputsm" min="1" max="10" type="number"></td>
                                            <td><input class="form-control input-sm pitofelinput" id="inputsm" min="1" max="20" type="number"></td>
                                            <td><input class="form-control input-sm pitofelinput" id="inputsm" min="1" max="20" type="number"></td>
                                            <td><input class="form-control input-sm pitofelinput" id="inputsm" min="1" max="15" type="number"></td>
                                            <td><input class="form-control input-sm pitofelinput" id="inputsm" min="1" max="5" type="number"></td>
                                            <td><input class="form-control input-sm pitofelinput" id="inputsm" min="1" max="20" type="number"></td>
                                            <td><input class="form-control input-sm pitofelinput" id="inputsm" min="1" max="5" type="number"></td>
                                            <td><input class="form-control input-sm pitofelinput" id="inputsm" min="1" max="100" type="number"></td>
                                            <td><input class="form-control input-sm pitofelinput textboxminwidth" id="inputsm" min="1" max="25" type="number"></td>
                                            <td><input class="form-control input-sm pitofelinput textboxminwidth" id="inputsm" min="1" max="25" type="number"></td>
                                            <td><input class="form-control input-sm pitofelinput textboxminwidth" id="inputsm" min="1" max="25" type="number"></td>
                                            <td><input class="form-control input-sm pitofelinput" id="inputsm" min="1" max="100" type="number"></td>
                                            <td></td>
                                            <td><input class="form-control input-sm pitofelinput" id="inputsm" min="1" max="10" type="number"></td>
                                            <td><input class="form-control input-sm pitofelinput" id="inputsm" min="1" max="42" type="number"></td>
                                            <td><input class="form-control input-sm pitofelinput" id="inputsm" min="1" max="34" type="number"></td>
                                            <td></td>
                                        </tr>`;
                        div.innerHTML += rowDiv;
                    }
                });
            }
            break;
    }
}

function saveMarksDetails() {
    $('#tBodyILAC > tr').each(function (index, row) {
        var listName = "ILAC";
        var studNo = $(this).find('td').eq(0).text();
        var examResult = $(this).find('td').eq(6).text();
        var studName = $(this).find('td').eq(1).text();
        var paperTest = $(this).find('td input').eq(0).val();
        var speakingTest = $(this).find('td input').eq(1).val();
        var id = $(this).data('id');
        if (paperTest != "" && speakingTest != "") {
            var reqData = JSON.stringify
                ({
                    __metadata:
                    {
                        type: "SP.Data." + listName + "ListItem"
                    },
                    StudentNo: studNo,
                    ExamType: $('input[name=optradio]:checked').val(),
                    Title: paperTest,
                    SpeakingTest: speakingTest,
                    Result: examResult
                });
            RestApiPost("ILAC", id, reqData).done(function () {
                if (rowsCount == saveCount) {
                    showToastr();
                    close();
                    saveCount = 0;
                }
            });
        }
    });

    $('#tBodyCPE > tr').each(function (index, row) {
        var listName = "CPE";
        var studNo = $(this).find('td').eq(0).text();
        var examResult = $(this).find('td').eq(8).text();
        var studName = $(this).find('td').eq(1).text();
        var RandUOE = $(this).find('td input').eq(0).val();
        var Listening = $(this).find('td input').eq(1).val();
        var writingpart1 = $(this).find('td input').eq(2).val();
        var writingpart2 = $(this).find('td input').eq(3).val();
        var id = $(this).data('id');
        if (RandUOE != "" && Listening != "" && writingpart1 != "" && writingpart2 != "") {
            var reqData = JSON.stringify
                ({
                    __metadata:
                    {
                        type: "SP.Data." + listName + "ListItem"
                    },
                    StudentNo: studNo,
                    ExamType: $('input[name=optradio]:checked').val(),
                    Title: RandUOE,
                    Listening: Listening,
                    WritingPT1: writingpart1,
                    WritingPT2: writingpart2,
                    ExamResult: examResult
                });
            RestApiPost(listName, id, reqData).done(function () {
                if (rowsCount == saveCount) {
                    showToastr();
                    close();
                    saveCount = 0;
                }
            });
        }
    });

    $('#tBodyTOFEL > tr').each(function (index, row) {
        var listName = "TOFEL";
        var studNo = $(this).find('td').eq(0).text();
        var examResult = $(this).find('td').eq(7).text();
        var studName = $(this).find('td').eq(1).text();
        var Writing = $(this).find('td input').eq(0).val();
        var Reading = $(this).find('td input').eq(1).val();
        var Listening = $(this).find('td input').eq(2).val();
        var id = $(this).data('id');
        if (Writing != "" && Reading != "" && Listening != "") {
            var reqData = JSON.stringify
                ({
                    __metadata:
                    {
                        type: "SP.Data.TOEFLListItem"
                    },
                    StudentNo: studNo,
                    ExamType: $('input[name=optradio]:checked').val(),
                    Title: Writing,
                    Listening: Listening,
                    Reading: Reading,
                    ExamResult: examResult
                });
            RestApiPost(listName, id, reqData).done(function () {
                if (rowsCount == saveCount) {
                    showToastr();
                    close();
                    saveCount = 0;
                }
            });
        }
    });

    $('#tBodyILETS > tr').each(function (index, row) {
        var listName = "IELTS";
        var studNo = $(this).find('td').eq(0).text();
        var examResult = $(this).find('td').eq(8).text();
        var studName = $(this).find('td').eq(1).text();
        var Writingpart1 = $(this).find('td input').eq(0).val();
        var Writingpart2 = $(this).find('td input').eq(1).val();
        var Reading = $(this).find('td input').eq(2).val();
        var Listening = $(this).find('td input').eq(3).val();
        var id = $(this).data('id');
        if (Writingpart1 != "" && Writingpart2 != "" && Reading != "" && Listening != "") {
            var reqData = JSON.stringify
                ({
                    __metadata:
                    {
                        type: "SP.Data." + listName + "ListItem"
                    },
                    StudentNo: studNo,
                    ExamType: $('input[name=optradio]:checked').val(),
                    Title: Writingpart1,
                    WritingPart2: Writingpart2,
                    Listening: Listening,
                    Reading: Reading,
                    ExamResult: examResult
                });
            RestApiPost(listName, id, reqData).done(function () {
                if (rowsCount == saveCount) {
                    showToastr();
                    close();
                    saveCount = 0;
                }
            });
        }
    });

    $('#tBodyKET > tr').each(function (index, row) {
        var listName = "KET";
        var studNo = $(this).find('td').eq(0).text();
        var examResult = $(this).find('td').eq(10).text();
        var courseworkResult = $(this).find('td').eq(7).text();
        var studName = $(this).find('td').eq(1).text();
        var courseworkspeaking = $(this).find('td input').eq(0).val();
        var courseworkwriting = $(this).find('td input').eq(1).val();
        var courseworkclasswork = $(this).find('td input').eq(2).val();
        var examReadingandwriting = $(this).find('td input').eq(3).val();
        var examListening = $(this).find('td input').eq(4).val();
        var id = $(this).data('id');
        if (courseworkspeaking != "" &&
            courseworkwriting != "" &&
            courseworkclasswork != "" &&
            examReadingandwriting != "" &&
            examListening != "") {
            var reqData = JSON.stringify
                ({
                    __metadata:
                    {
                        type: "SP.Data." + listName + "ListItem"
                    },
                    StudentNo: studNo,
                    ExamType: $('input[name=optradio]:checked').val(),
                    Title: courseworkspeaking,
                    CourseworkWriting: courseworkwriting,
                    CourseworkClassWork: courseworkclasswork,
                    CourseworkResult: courseworkResult,
                    ExamReading_x0026_Writing: examReadingandwriting,
                    ExamListening: examListening,
                    ExamResult: examResult
                });
            RestApiPost(listName, id, reqData).done(function () {
                if (rowsCount == saveCount) {
                    showToastr();
                    close();
                    saveCount = 0;
                }
            });
        }
    });

    $('#tBodyPET > tr').each(function (index, row) {
        var listName = "PET";
        var studNo = $(this).find('td').eq(0).text();
        var examResult = $(this).find('td').eq(10).text();
        var courseworkResult = $(this).find('td').eq(7).text();
        var studName = $(this).find('td').eq(1).text();
        var courseworkspeaking = $(this).find('td input').eq(0).val();
        var courseworkwriting = $(this).find('td input').eq(1).val();
        var courseworkclasswork = $(this).find('td input').eq(2).val();
        var examReadingandwriting = $(this).find('td input').eq(3).val();
        var examListening = $(this).find('td input').eq(4).val();
        var id = $(this).data('id');
        if (courseworkspeaking != "" &&
            courseworkwriting != "" &&
            courseworkclasswork != "" &&
            examReadingandwriting != "" &&
            examListening != "") {
            var reqData = JSON.stringify
                ({
                    __metadata:
                    {
                        type: "SP.Data." + listName + "ListItem"
                    },
                    StudentNo: studNo,
                    ExamType: $('input[name=optradio]:checked').val(),
                    Title: courseworkspeaking,
                    CourseworkWriting: courseworkwriting,
                    CourseworkClassWork: courseworkclasswork,
                    CourseworkResult: courseworkResult,
                    ExamReadingandWriting: examReadingandwriting,
                    ExamListening: examListening,
                    ExamResult: examResult
                });
            RestApiPost(listName, id, reqData).done(function () {
                if (rowsCount == saveCount) {
                    showToastr();
                    close();
                    saveCount = 0;
                }
            });
        }
    });

    $('#tBodyFCE > tr').each(function (index, row) {
        var listName = "FCE";
        var studNo = $(this).find('td').eq(0).text();
        var examResult = $(this).find('td').eq(10).text();
        var courseworkResult = $(this).find('td').eq(7).text();
        var studName = $(this).find('td').eq(1).text();
        var courseworkspeaking = $(this).find('td input').eq(0).val();
        var courseworkwriting = $(this).find('td input').eq(1).val();
        var courseworkclasswork = $(this).find('td input').eq(2).val();
        var examListening = $(this).find('td input').eq(3).val();
        var examReadingandUseofEnglish = $(this).find('td input').eq(4).val();
        var id = $(this).data('id');
        if (courseworkspeaking != "" &&
            courseworkwriting != "" &&
            courseworkclasswork != "" &&
            examReadingandUseofEnglish != "" &&
            examListening != "") {
            var reqData = JSON.stringify
                ({
                    __metadata:
                    {
                        type: "SP.Data." + listName + "ListItem"
                    },
                    StudentNo: studNo,
                    ExamType: $('input[name=optradio]:checked').val(),
                    Title: courseworkspeaking,
                    CourseworkWriting: courseworkwriting,
                    CourseworkClassWork: courseworkclasswork,
                    CourseworkResult: courseworkResult,
                    ExamReadingandWriting: examReadingandUseofEnglish,
                    ExamListening: examListening,
                    ExamResult: examResult
                });
            RestApiPost(listName, id, reqData).done(function () {
                if (rowsCount == saveCount) {
                    showToastr();
                    close();
                    saveCount = 0;
                }
            });
        }
    });

    $('#tBodyCAE > tr').each(function (index, row) {
        var listName = "CAE";
        var studNo = $(this).find('td').eq(0).text();
        var examResult = $(this).find('td').eq(10).text();
        var courseworkResult = $(this).find('td').eq(7).text();
        var studName = $(this).find('td').eq(1).text();
        var courseworkspeaking = $(this).find('td input').eq(0).val();
        var courseworkwriting = $(this).find('td input').eq(1).val();
        var courseworkclasswork = $(this).find('td input').eq(2).val();
        var examListening = $(this).find('td input').eq(3).val();
        var examReadingandUseofEnglish = $(this).find('td input').eq(4).val();
        var id = $(this).data('id');
        if (courseworkspeaking != "" &&
            courseworkwriting != "" &&
            courseworkclasswork != "" &&
            examReadingandUseofEnglish != "" &&
            examListening != "") {
            var reqData = JSON.stringify
                ({
                    __metadata:
                    {
                        type: "SP.Data." + listName + "ListItem"
                    },
                    StudentNo: studNo,
                    ExamType: $('input[name=optradio]:checked').val(),
                    Title: courseworkspeaking,
                    CourseworkWriting: courseworkwriting,
                    CourseworkClassWork: courseworkclasswork,
                    CourseworkResult: courseworkResult,
                    ExamReadingandWriting: examReadingandUseofEnglish,
                    ExamListening: examListening,
                    ExamResult: examResult
                });
            RestApiPost(listName, id, reqData).done(function () {
                if (rowsCount == saveCount) {
                    showToastr();
                    close();
                    saveCount = 0;
                }
            });
        }
    });

    $('#tBodyBECL > tr').each(function (index, row) {
        var listName = "BEC Lower";
        var studNo = $(this).find('td').eq(0).text();
        var examResult = $(this).find('td').eq(10).text();
        var courseworkResult = $(this).find('td').eq(6).text();
        var studName = $(this).find('td').eq(1).text();
        var courseworkspeaking = $(this).find('td input').eq(0).val();
        var courseworkwriting = $(this).find('td input').eq(1).val();
        var courseworkclasswork = $(this).find('td input').eq(2).val();
        var examListening = $(this).find('td input').eq(3).val();
        var examReadingandUseofEnglish = $(this).find('td input').eq(4).val();
        var id = $(this).data('id');
        if (courseworkspeaking != "" &&
            courseworkwriting != "" &&
            courseworkclasswork != "" &&
            examReadingandUseofEnglish != "" &&
            examListening != "") {
            var reqData = JSON.stringify
                ({
                    __metadata:
                    {
                        type: "SP.Data.BEC_x0020_LowerListItem"
                    },
                    StudentNo: studNo,
                    ExamType: $('input[name=optradio]:checked').val(),
                    Title: courseworkspeaking,
                    CourseworkWriting: courseworkwriting,
                    CourseworkClassWork: courseworkclasswork,
                    CourseworkResult: courseworkResult,
                    ExamReadingandWriting: examReadingandUseofEnglish,
                    ExamListening: examListening,
                    ExamResult: examResult
                });
            RestApiPost(listName, id, reqData).done(function () {
                if (rowsCount == saveCount) {
                    showToastr();
                    close();
                    saveCount = 0;
                }
            });
        }
    });

    $('#tBodyBECH > tr').each(function (index, row) {
        var listName = "BEC Higher";
        var studNo = $(this).find('td').eq(0).text();
        var examResult = $(this).find('td').eq(10).text();
        var courseworkResult = $(this).find('td').eq(6).text();
        var studName = $(this).find('td').eq(1).text();
        var courseworkspeaking = $(this).find('td input').eq(0).val();
        var courseworkwriting = $(this).find('td input').eq(1).val();
        var courseworkclasswork = $(this).find('td input').eq(2).val();
        var examListening = $(this).find('td input').eq(3).val();
        var examReadingandUseofEnglish = $(this).find('td input').eq(4).val();
        var id = $(this).data('id');
        if (courseworkspeaking != "" &&
            courseworkwriting != "" &&
            courseworkclasswork != "" &&
            examReadingandUseofEnglish != "" &&
            examListening != "") {
            var reqData = JSON.stringify
                ({
                    __metadata:
                    {
                        type: "SP.Data.BEC_x0020_HigherListItem"
                    },
                    StudentNo: studNo,
                    ExamType: $('input[name=optradio]:checked').val(),
                    Title: courseworkspeaking,
                    CourseworkWriting0: courseworkwriting,
                    CourseworkClassWork: courseworkclasswork,
                    CourseworkResult: courseworkResult,
                    ExamReadingandWriting: examReadingandUseofEnglish,
                    ExamListening: examListening,
                    ExamResult: examResult
                });
            RestApiPost(listName, id, reqData).done(function () {
                if (rowsCount == saveCount) {
                    showToastr();
                    close();
                    saveCount = 0;
                }
            });
        }
    });

    $('#tBodyPIIITOFEL > tr').each(function (index, row) {
        var listName = "PIIITOFEL";
        var studNo = $(this).find('td').eq(0).text();
        var courseworkResult = $(this).find('td').eq(16).text();
        var ConvertedResult = $(this).find('td').eq(20).text();
        var title = $(this).find('td input').eq(0).val();
        var quiz1 = $(this).find('td input').eq(1).val();
        var quiz2 = $(this).find('td input').eq(2).val();
        var inclassWriting = $(this).find('td input').eq(3).val();
        var longessayOutline = $(this).find('td input').eq(4).val();
        var quiz3 = $(this).find('td input').eq(5).val();
        var draftProcess = $(this).find('td input').eq(6).val();
        var researchPresentation = $(this).find('td input').eq(7).val();
        var p1 = $(this).find('td input').eq(8).val();
        var p2 = $(this).find('td input').eq(9).val();
        var p3 = $(this).find('td input').eq(10).val();
        var finalLongEssay = $(this).find('td input').eq(11).val();
        var writing = $(this).find('td input').eq(12).val();
        var reading = $(this).find('td input').eq(13).val();
        var listening = $(this).find('td input').eq(14).val();
        var id = $(this).data('id');
        if (title != "" &&
            quiz1 != "" &&
            quiz2 != "" &&
            inclassWriting != "" &&
            quiz3 != "" &&
            draftProcess != "" &&
            researchPresentation != "" &&
            p1 != "" &&
            p2 != "" &&
            p3 != "" &&
            finalLongEssay != "" &&
            writing != "" &&
            reading != "" &&
            listening != "") {
            var reqData = JSON.stringify
                ({
                    __metadata:
                    {
                        type: "SP.Data.PIIITOFELListItem"
                    },
                    StudentNo: studNo,
                    ExamType: $('input[name=optradio]:checked').val(),
                    Title: title,
                    Quiz1: quiz1,
                    Quiz2: quiz2,
                    InClassWriting: inclassWriting,
                    LongEssayOutline: longessayOutline,
                    Quiz3: quiz3,
                    DraftProcess: draftProcess,
                    ResearchPresentation: researchPresentation,
                    OData__x0053_P1: p1,
                    OData__x0053_P2: p2,
                    OData__x0053_P3: p3,
                    FinalLongEssay: finalLongEssay,
                    TermScore: courseworkResult,
                    Writing: writing,
                    Reading: reading,
                    Listening: listening,
                    Converted: ConvertedResult
                });
            RestApiPost(listName, id, reqData).done(function () {
                if (rowsCount == saveCount) {
                    showToastr();
                    close();
                    saveCount = 0;
                }
            });
        }
    });

    $('#tBodyPTOFEL > tr').each(function (index, row) {
        var listName = "PTOFEL";
        var studNo = $(this).find('td').eq(0).text();
        var courseworkResult = $(this).find('td').eq(17).text();
        var ConvertedResult = $(this).find('td').eq(21).text();
        var title = $(this).find('td input').eq(0).val();
        var quiz1 = $(this).find('td input').eq(1).val();
        var quiz2 = $(this).find('td input').eq(2).val();
        var inclassWriting = $(this).find('td input').eq(3).val();
        var participationhw34 = $(this).find('td input').eq(4).val();
        var longessayOutline = $(this).find('td input').eq(5).val();
        var quiz3 = $(this).find('td input').eq(6).val();
        var draftProcess = $(this).find('td input').eq(7).val();
        var researchPresentation = $(this).find('td input').eq(8).val();
        var p1 = $(this).find('td input').eq(9).val();
        var p2 = $(this).find('td input').eq(10).val();
        var p3 = $(this).find('td input').eq(11).val();
        var finalLongEssay = $(this).find('td input').eq(12).val();
        var writing = $(this).find('td input').eq(13).val();
        var reading = $(this).find('td input').eq(14).val();
        var listening = $(this).find('td input').eq(15).val();
        var id = $(this).data('id');
        if (title != "" &&
            quiz1 != "" &&
            quiz2 != "" &&
            inclassWriting != "" &&
            quiz3 != "" &&
            participationhw34 != "" &&
            draftProcess != "" &&
            researchPresentation != "" &&
            p1 != "" &&
            p2 != "" &&
            p3 != "" &&
            finalLongEssay != "" &&
            writing != "" &&
            reading != "" &&
            listening != "") {
            var reqData = JSON.stringify
                ({
                    __metadata:
                    {
                        type: "SP.Data.PTOFELListItem"
                    },
                    StudentNo: studNo,
                    ExamType: $('input[name=optradio]:checked').val(),
                    Title: title,
                    Quiz1: quiz1,
                    Quiz2: quiz2,
                    InClassWriting: inclassWriting,
                    ParticipationHW34: participationhw34,
                    LongEssayOutline: longessayOutline,
                    Quiz3: quiz3,
                    DraftProcess: draftProcess,
                    ResearchPresentation: researchPresentation,
                    OData__x0053_P1: p1,
                    OData__x0053_P2: p2,
                    OData__x0053_P3: p3,
                    FinalLongEssay: finalLongEssay,
                    TERMSCORE: courseworkResult,
                    Writing: writing,
                    Reading: reading,
                    Listening: listening,
                    Converted: ConvertedResult
                });
            RestApiPost(listName, id, reqData).done(function () {
                if (rowsCount == saveCount) {
                    showToastr();
                    close();
                    saveCount = 0;
                }
            });
        }
    });
}

function workOnIt() {
    $(".overlay").show();
}

function close() {
    $("#Loader").hide();
}



