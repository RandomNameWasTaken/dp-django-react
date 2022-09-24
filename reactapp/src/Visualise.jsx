import React from 'react';
import ReactDOM from 'react-dom'
import { init3Dgraphics } from './rendering.js';
import { StateApp } from './StateApp.ts'

function getWindowSize() {
    const {innerWidth, innerHeight} = window;
    return {innerWidth, innerHeight};
}


export default class Visualise extends React.Component {
    state = {
        value : this.props.value || StateApp.Visualise,

    };

    handleBackButton = event => {
        window.location.reload(false);
    };


    render() {
        const fileData = this.props.fileData;

        if (fileData === undefined || fileData.length === 0) {
            return (
                <div>
                    <h3>There are no data available</h3>
                    <p>Please got back to menu and try again</p>
                    <input type="submit" value="Back" onClick={this.handleBackButton} />
                </div>
            );
        }

        if (!this.state.canvases_rendered) {
            this.setState({ canvases_rendered : true });

            const window_sizes = getWindowSize();
            console.log(window_sizes);

            const canvas_number = Object.keys(fileData).length;

            var canvases = [];

            var index = 0;
            for (var key in fileData) {

                var width = 200;
                var height = 200;

                if (canvas_number === 1) {
                    width = window_sizes.innerWidth;
                    height = window_sizes.innerHeight;
                } else {
                    const division = Math.floor(canvas_number/2);

                    if (division <= 1) {
                        height = window_sizes.innerHeight;
                    } else {
                        height =  Math.floor(window_sizes.innerHeight/2);
                    }
                    width = Math.floor(window_sizes.innerWidth / (division + 1));
                    console.log("width", width);

                    console.log("height", height);
                }

                console.log("index", index);

                canvases.push(React.createElement('canvas', { id : "canvas" + index, width: width, height: height }));
                index += 1;
            };

            const div = React.createElement('div', { id : "canvases_react", }, canvases);
            ReactDOM.render(
                div,
                document.getElementById('canvases')
            );

            return (<div>DDD</div>);
        }

        try {
            var index = 0;
            for (var key in fileData) {
                const data = fileData[key];

                const canvas = document.getElementById("canvas" + index);

                console.log(canvas);
                init3Dgraphics(canvas, data);

                index += 1;
            };
            
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