import React from 'react';
import ReactDOM from 'react-dom'
import { init3Dgraphics } from './rendering.js';
import { StateApp } from './StateApp.ts'

function getWindowSize() {
    const main_div = document.getElementById('root');
    const innerWidth = main_div.clientWidth;
    const innerHeight = Math.max(main_div.clientHeight, 900);

    return {innerWidth, innerHeight};
}


export default class Visualise extends React.Component {
    state = {
        value : this.props.value || StateApp.Visualise,
        number_of_nodes : 10,
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

            var canvas_number = Object.keys(fileData).length;

            var canvases = [];
            var objects = [];

            var index = 0;

            var both_semantics = false;
            if (fileData[0]['sync'] !== undefined && fileData[0]['async'] !== undefined) {
                both_semantics = true;
                canvas_number = canvas_number * 2;
            }

            var width_height = {};

            if (both_semantics) {
                for (var key in fileData) {

                    for (var sem in fileData[key]) {
                        if (sem === 'Lines' || sem === 'Nodes') {
                            if (sem === 'NumberOfNodes') {
                                this.setState({ number_of_nodes : fileData[key][sem] });
                            }
                            continue
                        }

                        var width = window_sizes.innerWidth;
                        var height =  window_sizes.innerHeight;

                        const division = Math.floor(canvas_number/2);
                        if (division <= 1) {
                            height = window_sizes.innerHeight;
                        } else {
                            height = Math.floor(window_sizes.innerHeight/2);
                        }
                        width = Math.floor(window_sizes.innerWidth / (division + 1));
                        

                        canvases.push(React.createElement('canvas', { id : "canvas" + index, width: width, height: height, class: "col" }));

                        const quotient = Math.floor(index/2);
                        const remain = index % 2;
                        width_height[index] = { 'w' : remain * width, 'h': quotient * height };

                        index += 1;
                    }
                    objects.push(React.createElement('div', { class: "row" }, canvases));
                    canvases = [];
                };
                const div = React.createElement('div', { id : "canvases_react", class: "col" }, objects);
                ReactDOM.render(
                    div,
                    document.getElementById('canvases')
                );

            } else {
                for (var key in fileData) {

                    for (var sem in fileData[key]) {
                        if (sem === 'Lines' || sem === 'Nodes') {
                            if (sem === 'NumberOfNodes') {
                                this.setState({ number_of_nodes : fileData[key][sem] });
                            }
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
                        const quotient = Math.floor(index/2);
                        const remain = index % 2;
                        width_height[index] = { 'w' : remain * width, 'h': quotient * height };
                        index += 1;
                    }
                };

                const div = React.createElement('div', { id : "canvases_react", class: "row" }, canvases);
                ReactDOM.render(
                    div,
                    document.getElementById('canvases')
                );
            }

            this.setState({ canvases_rendered : true });
            this.setState({ width_height : width_height });
        }

        if (this.state.width_height) {
            const width_height = this.state.width_height;
            try {

                var index = 0;
                for (var key in fileData) {
                    for (var sem in fileData[key]) {
                        if (sem === 'Lines' || sem === 'Nodes') {
                            continue
                        }
                        const data = fileData[key][sem];
                        const canvas = document.getElementById("canvas" + index);

                        init3Dgraphics(canvas, data, fileData[key]['Nodes'], width_height[index]['w'], width_height[index]['h']);

                        index += 1;
                    }
                };
            } catch (error) {
                return (
                    <div class="back">
                        <h3 class="wrapperh3">Cannot visualize</h3>
                        <div class="row back">
                            <div class="col-lg-2">
                                <input type="submit" value="Back" class="btn-dark btn-md btn" onClick={this.handleBackButton} />
                            </div>
                        </div>
                    </div>
                );
            }
        }
          

        return (
            <div class="row back">
                <div class="col-lg-2">
                  <input type="submit" value="Back" class="btn-dark btn-md btn" onClick={this.handleBackButton} />
                </div>
            </div>
        );
    }
}
 
//export default Visualise;