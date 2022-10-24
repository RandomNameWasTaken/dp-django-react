import React from 'react';
import App from './App';
import { StateApp } from './StateApp.ts';
import Visualise from './Visualise';

export default class LoadJson extends React.Component {
    state = {
        value : this.props.value || StateApp.LoadJson,
        selectedFile: null,
        resultData: null
    };

    onFileChange = event => {
        // Update the state
        this.setState({ selectedFile: event.target.files[0] });
    };

    // On file upload (click the upload button)
    onFileUpload = () => {
        const file = this.state.selectedFile;

        var reader = new FileReader();
        reader.readAsText(file,'UTF-8');
     
        reader.addEventListener("load", e => {
            this.setState({ resultData : JSON.parse([ reader.result ]) });
            this.setState({ value : StateApp.Visualise });
        });
    };

    fileData = () => {
    
        if (this.state.selectedFile) {
           
          return (
            <div>
              <h2>File Details:</h2>
               
                <p>File Name: {this.state.selectedFile.name}</p>
   
            </div>
          );
        }
        return (
        <div>
            <br />
            <h6>Choose before Pressing the Process button</h6>
        </div>
        );
    };

    handleBackButton = event => {
        this.setState({ value : StateApp.MainApp });
    };

    render() {

      if (this.state.value === StateApp.MainApp) {
        return <App />;
      }

      return (
          <div class="row loadJSONwrapper">
            <div class="col">

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
 
//export default LoadAeon;