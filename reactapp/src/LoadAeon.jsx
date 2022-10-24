import React from 'react';
import App from './App';
import { StateApp } from './StateApp.ts';
import ChooseConfig from './ChooseConfig';
import axios from "axios";

export default class LoadAeon extends React.Component {
    state = {
        value : this.props.value || StateApp.LoadAeon,
        selectedFile: this.props.selectedFile || null,
    };
  //  const [param_arguments, set_param_arguments] = useState();

    onFileChange = event => {
      // Update the state
      this.setState({ selectedFile: event.target.files[0] });
    };

    // On file upload (click the upload button)
    onFileUpload = () => {

      if (!this.state.sync && !this.state.async) {
        // TODO chyba aspon jedno musi byt
        return;
      }
      
      const file = this.state.selectedFile;

      var reader = new FileReader();
      reader.readAsText(file,'UTF-8');
    
      reader.addEventListener("load", () => {
          var r = reader.result;

          var r_lines = r.split("\n");
          const regex_comment = /^\s*#/;
          var result_data = [];
          for (let i = 0; i < r_lines.length; i++) {
            if (r_lines[i].match(regex_comment)) {
              continue;
            }
            result_data.push(r_lines[i]);
          }

          this.setState({ file_read : result_data });
          const result_data_joined = result_data.join(" %% ");
          document.cookie="resultData=" + result_data_joined + "; SameSite=None; Secure";
      });

      this.setState({ value : StateApp.ChooseConfig });
    };
  
    fileData = () => {    
        if (this.state.selectedFile) {
           
          return (
            <div>
              <h2>File Details:</h2>
               
                <p>File Name: {this.state.selectedFile.name}</p>   
            </div>
          );
        } else {
          return (
            <div>
              <br />
              <h6>Choose before Pressing the Process button</h6>
            </div>
          );
        }
    };

    handleBackButton = event => {
      this.setState({ value : StateApp.MainApp });
    };

    render() {
        if (this.state.value === StateApp.MainApp) {
          return <App />;
        }

        
        if (this.state.value === StateApp.ChooseConfig) {
          return <ChooseConfig file_read={this.state.file_read} async={this.state.async} sync={this.state.sync} selectedFile={this.state.selectedFile}/>;
        }

        return (
          <div class="row loadAEONwrapper">
            <div class="col">
              <div class="row" className="App">
                <h3 class="wrapperh3">
                Type
                </h3>
                <form>
                <div class="form-check form-check-inline">
                  <input type="checkbox" class="cblack" id="async" name="semantics" value="1" onChange={event => this.setState({async : true})}/>
                  <label for="async" class="form-check-label">Asynchroneous</label>
                </div>
                <div class="form-check form-check-inline">
                  <input type="checkbox" class="cblack" id="sync" name="semantics" value="2" onChange={event => this.setState({sync : true})}/>
                  <label class="form-check-label" for="sync">Synchroneous</label>
                </div>
                </form>
              </div>

              <br/>
              <br/>

              <div class="row" className="App">
                <h3 class="wrapperh3">
                  File Upload
                </h3>

                <div class="col-lg-4 center">
                    <input type="file" class="form-control center" onChange={this.onFileChange} accept=".aeon"/>
                    <button onClick={this.onFileUpload} class="btn-dark wrapperh3 btn-md btn">
                      Process
                    </button>
                </div>

              {this.fileData()}
              </div>
            </div>
            <div class="row">
              <div class="col-lg-2">
                <input type="submit" value="Back" class="btn-dark btn-md btn" onClick={this.handleBackButton} />
              </div>
            </div>
          </div>
          );
    }
}
