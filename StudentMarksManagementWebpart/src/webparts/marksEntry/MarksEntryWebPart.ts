import { Version } from '@microsoft/sp-core-library';
import {
  BaseClientSideWebPart,
  IPropertyPaneConfiguration,
  PropertyPaneTextField
} from '@microsoft/sp-webpart-base';
import * as pnp from "sp-pnp-js";
import { escape } from '@microsoft/sp-lodash-subset';
import 'jquery';
import * as strings from 'MarksEntryWebPartStrings';

export interface IMarksEntryWebPartProps {
  description: string;
}

class Stud {
  studName: string;
  studNo: string;
  exam: string;
  constructor(name: string, no: string) {
    this.studName = name;
    this.studNo = no;
  }
}

export default class MarksEntryWebPart extends BaseClientSideWebPart<IMarksEntryWebPartProps> {
  private _currentWebUrl: string;
  private _currentUserName: string;

  public onInit(): Promise<void> {

    return super.onInit().then(_ => {
      pnp.setup({
        spfxContext: this.context
      });
    });
  }

  public getTeacherFromList(): void {
    var mythis = this;
    pnp.sp.web.lists.getByTitle('Teachers').items.get().then(function (result) {
      mythis.displayData(result);
    }, function (er) {
      alert("Oops, Something went wrong, Please try after sometime");
      console.log("Error:" + er);
    });
  }

  public displayData(data): void {
    var div = document.getElementById("ddlTeacher");
    data.forEach(function (val) {
      var myHtml =
        '<option value="' + val.Title + '">' + val.Title + '</option>';
      div.innerHTML += myHtml;
    });
  }

  public bindOuterHtml(val): void {
    var mainDiv = document.getElementById('mainContainer');
    switch (val) {
      case 'ILAC':
        var headerDiv = `<div class="container-fluid">
        <table class="table table-bordered table-condensed">
            <thead>
                <tr>
                    <th>Student ID</th>
                    <th>Name</th>
                    <th>Exam</th>
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
      case 'CPE':
        var headerDiv = `<div class="container-fluid">
        <table class="table table-bordered table-condensed">
            <thead>
                <tr>
                    <th>Student ID</th>
                    <th>Name</th>
                    <th>Exam</th>
                    <th>R&UOE</th>
                    <th>Listening</th>
                    <th>Writing PT1</th>
                    <th>Writing PT2</th>
                    <th>Exam Result</th>
                </tr>
            </thead>
            <tbody id="tBodyCPE">
            </tbody>
            </table>
          </div>`;
        mainDiv.innerHTML += headerDiv;
        break;
      case 'TOFEL':
        var headerDiv = `<div class="container-fluid">
        <table class="table table-bordered table-condensed">
            <thead>
                <tr>
                    <th>Student ID</th>
                    <th>Name</th>
                    <th>Exam</th>
                    <th>Writing</th>
                    <th>Reading</th>
                    <th>Listening</th>
                    <th>Exam Result</th>
                </tr>
            </thead>
            <tbody id="tBodyTOFEL">
            </tbody>
            </table>
          </div>`;
        mainDiv.innerHTML += headerDiv;
        break;
      case 'IELTS':
        var headerDiv = `<div class="container-fluid">
        <table class="table table-bordered table-condensed">
            <thead>
                <tr>
                    <th>Student ID</th>
                    <th>Name</th>
                    <th>Exam</th>
                    <th>Writing Part 1</th>
                    <th>Writing Part 2</th>
                    <th>Listening</th>
                    <th>Reading</th>
                    <th>Exam Result</th>
                </tr>
            </thead>
            <tbody id="tBodyIELTS">
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
                    <th>Student ID</th>
                    <th>Name</th>
                    <th>Exam</th>
                    <th>Coursework Speaking</th>
                    <th>Coursework Writing</th>
                    <th>Coursework ClassWork</th>
                    <th>Coursework Result</th>
                    <th>Exam Reading and Writing</th>
                    <th>Exam Listening</th>
                    <th>Exam Result</th>
                </tr>
            </thead>
            <tbody id="tBodyDefault">
      </tbody>
      </table>
    </div>`;
        mainDiv.innerHTML += headerDiv;
        break;
    }
  }

  public getStudentsFromTeacherName(): void {
    var mythis = this;
    pnp.sp.web.lists.getByTitle('Students').items
      .select("Student_x0020_No,Title,Principal")
      .filter("Principal_x0020__x002d__x0020_Te eq '" + this._currentUserName + "'")
      .get()
      .then(function (result) {
        var PrincipalVal: string[] = new Array();
        var studArray: Stud[] = new Array();
        result.forEach(function (studentVal) {
          PrincipalVal.push(studentVal.Principal);
          studArray.push(new Stud(studentVal.Title, studentVal.Student_x0020_No));
        });
        var uniquePrincipalVal = PrincipalVal.filter(function (elem, pos) {
          return PrincipalVal.indexOf(elem) == pos;
        }.bind(this));
        if (uniquePrincipalVal.length > 0) {
          if (uniquePrincipalVal.length > 1) {
            uniquePrincipalVal.forEach(function (principalVal) {
              pnp.sp.web.lists.getByTitle('Classes')
                .items
                .select("ProficiencyTest")
                .filter("Title eq '" + principalVal + "'").get().then(function (result) {
                  result.forEach(function (classVal) {
                    mythis.bindOuterHtml(classVal.ProficiencyTest);
                  });
                });
            });
          } else {
            pnp.sp.web.lists.getByTitle('Classes')
              .items
              .select("ProficiencyTest")
              .filter("Title eq '" + uniquePrincipalVal[0] + "'").get().then(function (result) {
                result.forEach(function (classVal) {
                  mythis.bindOuterHtml(classVal.ProficiencyTest);
                  studArray.forEach(function (data) {
                    var div = document.getElementById("tBodyILAC");
                    var rowDiv = `<tr>
                     <td class="sid">`+ data.studNo + `</td>
                     <td class="sname">`+ data.studName + `</td>
                     <td class="exam">`+ classVal.ProficiencyTest + `</td>
                     <td class="edit"><input class="form-control input-sm ilacinput" type="text" max="200"></td>
                     <td class="edit"><input class="form-control input-sm ilacinput" type="text"></td>
                     <td><span id="resultILAC"></span></td>
                     </tr>`;
                    div.innerHTML += rowDiv;
                  });
                });
              });
          }
        }
      }, function (er) {
        alert("Oops, Something went wrong, Please try after sometime");
        console.log("Error:" + er);
      });
  }

  public render(): void {
    this._currentWebUrl = this.context.pageContext.web.absoluteUrl;
    this._currentUserName = this.context.pageContext.user.loginName;
    localStorage.setItem("url", this._currentWebUrl);
    localStorage.setItem("currentUserName", this._currentUserName);
    require("./app/marks.css");
    require("./app/marks.js");
    this.domElement.innerHTML = `<div id="Loader" class="overlay">
      <div class="box">
        <div class="loader8"></div>
      </div>
      </div>
      <div id="snackbar"><i class="fa fa-check" aria-hidden="true" style="padding-right:10px;"></i>Marks updated successfully..!</div>
      <div id="snackbarResult"><i class="fa fa-check" aria-hidden="true" style="padding-right:10px;"></i>Results submitted successfully..!</div> 
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/4.7.0/css/font-awesome.min.css"/>
    <link rel="stylesheet" href="https://maxcdn.bootstrapcdn.com/bootstrap/3.3.5/css/bootstrap.min.css"/>
    <div class="row header">
    <div class="col-sm-3 mde">Student Marks</div>
    <div class="col-sm-6" style="text-align:center">
    <img class="header_logo" src="https://46dtbf3k4dl51vghpj6qqocj-wpengine.netdna-ssl.com/wp-content/themes/ilac/img/ILAC-white-logo.png">​​
    </div>
    <div class="col-sm-3 pull-right">
        <label  class="radio-inline rad"><input type="radio" disabled value="Mid" name="optradio">Mid Term</label>
        <label  class="radio-inline rad"><input type="radio" disabled value="Final" name="optradio">Final</label>
        <div class="input-group">
            <span class="input-group-addon"><i class="glyphicon glyphicon-user"></i></span>
            <select class="form-control" id="ddlTeacher" disabled>
              </select>
        </div>
        <div id="searchboxDiv" style="display:none;" class="input-group stylish-input-group srcbox">
                    <input type="text" id="StudentSearchBox" class="form-control"  placeholder="Search Student No" >
                    <span class="input-group-addon">
                        <button id="btnSearch" type="submit">
                            <span class="fa fa-search"></span>
                        </button>  
                    </span>
          </div>
    </div>
</div>
<div id="mainContainer">
</div>
<div class="row" style="margin: 0px;">
    <div class="controls col-sm-4">
        <button class="btn btn-default" type="button" id="btnSave"><i class="fa fa-floppy-o" aria-hidden="true"></i> Save</button>
    </div>
    <div class="controls col-sm-4">
        <button class="btn btn-default" type="button" id="btnSubmit"><i class="fa fa-bookmark" aria-hidden="true"></i> Submit</button>
    </div>
    <div class="controls col-sm-4">
        <button type="button" id="btncancel"><i class="fa fa-close" aria-hidden="true"></i> Cancel</button>
    </div>
</div>`;

  }

  protected get dataVersion(): Version {
  return Version.parse('1.0');
}

  
  protected getPropertyPaneConfiguration(): IPropertyPaneConfiguration {
  return {
    pages: [
      {
        header: {
          description: strings.PropertyPaneDescription
        },
        groups: [
          {
            groupName: strings.BasicGroupName,
            groupFields: [
              PropertyPaneTextField('description', {
                label: strings.DescriptionFieldLabel
              })
            ]
          }
        ]
      }
    ]
  };
}
}
