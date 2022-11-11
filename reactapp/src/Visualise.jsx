import React from 'react';
import ReactDOM from 'react-dom'
import { init3Dgraphics } from './rendering.js';
import { StateApp } from './StateApp.ts';
import InfoIcon from './Icons/InfoIcon';


function getWindowSize() {
    const main_div = document.getElementById('root');
    const innerWidth = main_div.clientWidth;
    const innerHeight = Math.max(main_div.clientHeight, 900);

    return {innerWidth, innerHeight};
}

function dec2bin(dec, n) {
  dec = Number(dec);
  var res = dec.toString(2);

  if (res.length < n) {
    for (let i = 0; i < (n - res.length); ++i) {
      res = '0' + res;
    }
  }
  return res;
}

export default class Visualise extends React.Component {
    state = {
        value : this.props.value || StateApp.Visualise
    };

    handleBackButton = event => {
        window.location.reload(false);
    };

    findStartingCluster = (data, param, sem) => {
        if (this.state.startState !== undefined) {
            return;
        }

        const nodes = data[param]['Nodes'];
        var startStateId = null;

        for (var key in data[param][sem]) {
            if (data[param][sem][key]['Rank'] === 0 && startStateId === null) {
                const splitted = key.split('_');
                startStateId = splitted[1];
                break;
            }
        }

        const startStateBin = dec2bin(startStateId, Object.keys(nodes).length);
        var startState = '';
        for (var i = 0; i < startStateBin.length; i++) {
            if (startStateBin[i] === '1') {
                startState += nodes[i];
            }
        }
        this.setState({ startState : startState });
    }

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
            this.setState({ both : both_semantics });


            var width_height = {};
            if (both_semantics) {
                for (var key in fileData) {
                    canvases.push(React.createElement("h3", { class : "col-1"}, [ fileData[key]["Lines"].length > 0 ? <InfoIcon title={fileData[key]["Lines"]}/> : '', Number(key) + 1]));

                    for (var sem in fileData[key]) {
                        if (sem === 'Lines' || sem === 'Nodes') {
                            if (sem === 'NumberOfNodes') {
                                this.setState({ number_of_nodes : fileData[key][sem] });
                            }
                            continue
                        }

                        this.findStartingCluster(fileData, key, sem);

                        var width = window_sizes.innerWidth;
                        var height =  window_sizes.innerHeight;

                        const division = Math.floor(canvas_number/2);
                        if (division <= 1) {
                            height = window_sizes.innerHeight;
                        } else {
                            height = Math.floor(window_sizes.innerHeight/2);
                        }
                        width = Math.floor(window_sizes.innerWidth / (division + 1));
                        
                        const canvas = React.createElement('canvas', { id : "canvas" + index, width: width, height: height });
                        const can_div = React.createElement('div', { id : "div" + index });

                        canvases.push(React.createElement('div', { class: "col-5" }, [can_div, canvas]));

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
                    canvases.push(React.createElement("h3", { class : "col-1"}, [ fileData[key]["Lines"].length > 0 ? <InfoIcon title={fileData[key]["Lines"]}/> : '', Number(key) + 1]));

                    for (var sem in fileData[key]) {
                        if (sem === 'Lines' || sem === 'Nodes') {
                            if (sem === 'NumberOfNodes') {
                                this.setState({ number_of_nodes : fileData[key][sem] });
                            }
                            continue
                        }

                        this.findStartingCluster(fileData, key, sem);

                        var width = window_sizes.innerWidth;
                        var height =  window_sizes.innerHeight;

                        const division = Math.floor(canvas_number/2);
                        if (division <= 1) {
                            height = window_sizes.innerHeight;
                        } else {
                            height = Math.floor(window_sizes.innerHeight/2);
                        }
                        width = Math.floor(window_sizes.innerWidth / (division + 1));

                        const canvas = React.createElement('canvas', { id : "canvas" + index, width: width, height: height });
                        const can_div = React.createElement('div', { id : "div" + index } );

                        canvases.push(React.createElement('div', { class: "col-5" }, [can_div, canvas]));

                        const quotient = Math.floor(index/2);
                        const remain = index % 2;
                        width_height[index] = { 'w' : remain * width, 'h': quotient * height };

                        index += 1;
                    }

                    if (index % 2 == 0) {
                        objects.push(React.createElement('div', { class: "row" }, canvases));
                        canvases = [];
                    }
                };

                if (canvases.length > 0) {
                    objects.push(React.createElement('div', { class: "row" }, canvases));
                }

                const div = React.createElement('div', { id : "canvases_react", class: "col" }, objects);
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
                        const div = document.getElementById("div" + index);

                        init3Dgraphics(canvas, div, data, fileData[key]['Nodes'], width_height[index]['w'], width_height[index]['h']);

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

        var headline;
        if (this.state.both) {
            headline =
                    <div class="row">
                        <h3 class="col-6 App">Asymetric</h3>
                        <h3 class="col-6 App">Symetric</h3>
                    </div>;
        }

        return (
            <div class="row back">
                <div class="col">
                    <div class="row">
                        <input type="submit" value="Back" class="btn-dark btn-md btn" onClick={this.handleBackButton} />
                        <h3 class="wrapperh3 App"> {'Initial state ' + this.state.startState}</h3>
                    </div>
                    {headline}
                </div>
            </div>
        );
    }
}
 
//export default Visualise;