import React from 'react';
import { init3Dgraphics } from './rendering.js';
import { StateApp } from './StateApp.ts'



export default class Visualise extends React.Component {
    state = {
        value : this.props.value || StateApp.Visualise
    };

    handleBackButton = event => {
        window.location.reload(false);
    };


    render() { 
        const canvas = document.getElementById('canvas');
        const fileData = this.props.fileData;

        if (fileData === undefined || fileData === '') {
            return (
                <div>
                    <h3>There are no data available</h3>
                    <p>Please got back to menu and try again</p>
                    <input type="submit" value="Back" onClick={this.handleBackButton} />
                </div>
            );
        }

        try {
            init3Dgraphics(canvas, fileData);
        } catch (error) {
            console.log(error)
            return (
                <div>
                    <h3>Cannot visualize</h3>
                    <input type="submit" value="Back" onClick={this.handleBackButton} />
                </div>
            );
        }
          

        return (
            <div>
                <input type="submit" value="Back" onClick={this.handleBackButton} />
            </div>
        );
    }
}
 
//export default Visualise;