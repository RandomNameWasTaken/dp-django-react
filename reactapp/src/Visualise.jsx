import React from 'react';
import ReactDOM from 'react-dom'
import { init3Dgraphics } from './rendering.js';
import { StateApp } from './StateApp.ts';
import InfoIcon from './Icons/InfoIcon';
import DownloadIcon from './Icons/DownloadIcon';
import { getWindowSize, dec2bin  } from "./utils";


export default class Visualise extends React.Component {
    state = {
        value : this.props.value || StateApp.Visualise
    };

    handleBackButton = event => {
        window.location.reload(false);
    };

    getExportButton = (index) => {
        return React.createElement('span', { name: "Export", onClick: () => { this.handleExport(index) } }, [ React.createElement(DownloadIcon, { size: "40" }) ]);
    }

    createInfo = (fileData, key, index, both_semantics) => {
        const param_lines = fileData[key]["Lines"].length > 0 ? React.createElement('div', { class : "row"}, [<InfoIcon title={fileData[key]["Lines"]}/>]) : '';
        const number =  React.createElement('div', { class : "row" }, [ Number(key) + 1 ]);

        var elements = [ param_lines, number, React.createElement('br') ];

        return React.createElement("h3", { class : "col-1"}, elements);
    }

    findStartingCluster = (data, param, sem) => {
        if (this.state.startState !== undefined) {
            return;
        }

        const nodes = data[param]['Nodes'];
        var startStateId = null;

        for (var key in data[param][sem]) {
            if (data[param][sem][key]['Rank'] === 0) {
                const splitted = key.split('_');
                startStateId = splitted[1];
                break;
            }
        }

        const number_of_nodes = Object.keys(nodes).length;
        const startStateBin = dec2bin(startStateId, number_of_nodes);
        var startState = '';
        for (var i = 0; i < startStateBin.length; i++) {
            if (startStateBin[i] === '1') {
                if (startState !== '') {
                    startState += ', ';
                }

                startState += nodes[i];
            }
        }

        if (startState === '') {
            startState = ' no nodes chosen'
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
            console.log(fileData);
            console.log(Object.keys(fileData));
            for (var key in fileData) {
                canvases.push(this.createInfo(fileData, key, index, both_semantics));

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
                    const can_div = React.createElement('div', { id : "div" + index, class: "col-8" });
                    const gui_div = React.createElement('div', { id : "gui_div" + index, class: "col-4" });
                    const divs = React.createElement('div', { class: "row" }, [gui_div, can_div]);

                    const cl = Object.keys(fileData).length === 1 && !both_semantics ? "col-11" : "col-5";
                    canvases.push(React.createElement('div', { class: cl }, [divs, canvas]));

                    const quotient = Math.floor(index/2);
                    const remain = index % 2;
                    width_height[index] = { 'w' : remain * width, 'h': quotient * height };

                    index += 1;
                }

                if (both_semantics || index % 2 === 0 ) {
                    objects.push(React.createElement('div', { class: "row" }, canvases));
                    canvases = [];
                } 
            
            }

            if (canvases.length > 0 && !both_semantics) {
                objects.push(React.createElement('div', { class: "row" }, canvases));
            }

            const div = React.createElement('div', { id : "canvases_react", class: "col" }, objects);
            ReactDOM.render(
                div,
                document.getElementById('canvases')
            );

            this.setState({ canvases_rendered : true });
            this.setState({ width_height : width_height });
        }

        if (this.state.width_height) {
            const width_height = this.state.width_height;
            try {

                index = 0;
                for (key in fileData) {
                    for (sem in fileData[key]) {
                        if (sem === 'Lines' || sem === 'Nodes') {
                            continue
                        }
                        const data = fileData[key][sem];
                        const canvas = document.getElementById("canvas" + index);
                        const div = document.getElementById("div" + index);
                        const gui_div = document.getElementById("gui_div" + index);

                        init3Dgraphics(canvas, div, gui_div, data, fileData[key]['Nodes'], width_height[index]['w'], width_height[index]['h']);
                        //this.setState({ 'obj' : obj });
                        //const scene = init3Dgraphics(canvas, div, gui_div, data, fileData[key]['Nodes'], width_height[index]['w'], width_height[index]['h']);
                        //this.setState({ key: scene });

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
                        <h3 class="col-6 App">Asymmetric</h3>
                        <h3 class="col-6 App">Symmetric</h3>
                    </div>;
        }

        return (
            <div class="row back">
                <div class="col">
                    <div class="row">
                        <input type="submit" value="Back" class="btn-dark btn-md btn" onClick={this.handleBackButton} />
                        <h3 class="wrapperh3 App"> {'Initial state: ' + this.state.startState}</h3>
                    </div>
                    {headline}
                </div>
            </div>
        );
    }
}
 
//export default Visualise;