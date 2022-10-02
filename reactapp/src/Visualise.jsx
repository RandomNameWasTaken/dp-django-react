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

            const window_sizes = getWindowSize();

            const canvas_number = Object.keys(fileData).length;

            var canvases = [];

            var index = 0;
            console.log("filedata ", fileData);

            var both_semantics = false;
            if (fileData[0]['sync'] !== undefined && fileData[0]['async'] !== undefined) {
                both_semantics = true;
            }

            console.log("both ", both_semantics);

            if (both_semantics) {
                for (var key in fileData) {

                    for (var sem in fileData[key]) {
                        if (sem === 'Lines') {
                            continue
                        }

                        var width = window_sizes.innerWidth;
                        var height =  window_sizes.innerHeight;
                        if (canvas_number > 1) {

                            const division = Math.floor(canvas_number/2);
                            if (division <= 1) {
                                height = window_sizes.innerHeight;
                            } else {
                                height =  Math.floor(window_sizes.innerHeight/2);
                            }
                            width = Math.floor(window_sizes.innerWidth / (division + 1));
                        }

                        canvases.push(React.createElement('canvas', { id : "canvas" + index, width: width, height: height, class: "col" }));

                        index += 1;
                    }
                };

            } else {
                for (var key in fileData) {

                    for (var sem in fileData[key]) {
                        if (sem === 'Lines') {
                            continue
                        }


                        var width = window_sizes.innerWidth;
                        var height =  window_sizes.innerHeight;
                        if (canvas_number > 1) {

                            const division = Math.floor(canvas_number/2);
                            if (division <= 1) {
                                height = window_sizes.innerHeight;
                            } else {
                                height =  Math.floor(window_sizes.innerHeight/2);
                            }
                            width = Math.floor(window_sizes.innerWidth / (division + 1));
                        }

                        canvases.push(React.createElement('canvas', { id : "canvas" + index, width: width, height: height, class: "col" }));
                        index += 1;
                    }
                };
            }

            const div = React.createElement('div', { id : "canvases_react", class: "row" }, canvases);
            ReactDOM.render(
                div,
                document.getElementById('canvases')
            );
            this.setState({ canvases_rendered : true });


            return (<div>DDD</div>);
        }

        try {
            var index = 0;
            for (var key in fileData) {
                for (var sem in fileData[key]) {
                    if (sem === 'Lines') {
                        continue
                    }
                    const data = fileData[key][sem];
                    console.log(data);

                    const canvas = document.getElementById("canvas" + index);
                    init3Dgraphics(canvas, data);

                    index += 1;
                }
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