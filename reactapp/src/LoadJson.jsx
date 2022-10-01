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
                <p>File Type: {this.state.selectedFile.type}</p>
   
            </div>
          );
        }
        return (
        <div>
            <br />
            <h4>Choose before Pressing the Upload button</h4>
        </div>
        );
    };

    handleBackButton = event => {
        this.setState({ value : StateApp.App });
    };

    render() { 
        if (this.state.value === StateApp.App) {
          return <App />;
        }

        if (this.state.value === StateApp.Visualise) {
          return <Visualise fileData={this.state.resultData} />;
        }        

        return (
            <div>
                <h3>
                  File Upload
                </h3>
                <div>
                    <input type="file" onChange={this.onFileChange} accept=".json" />
                    <button onClick={this.onFileUpload}>
                      Process
                    </button>
                </div>
              {this.fileData()}

              <input type="submit" value="Back" onClick={this.handleBackButton} />
            </div>
          );
    }
}
 
//export default LoadAeon;