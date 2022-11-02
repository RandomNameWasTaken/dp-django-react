import './App.css';
import React from 'react';
import Visualise from './Visualise';
import App from './App';
import LoadAeon from './LoadAeon';
import { StateApp } from './StateApp.ts';
import axios from "axios";


let param_arguments = {};
let param_lines = {};

class ChooseConfig extends React.Component {
  state = {
    value : this.props.value || StateApp.ChooseConfig,
    checked_nodes : [],
    compute: false,
    asked : false,
    param_arguments: {},
    param_count : 1,
    isOpen: false,
  };

   handleCheckSyntax = (event) => {
      const name = event.currentTarget.id;
      const element = event.target;
      const parent_id = element.closest("ul").getAttribute("id").split('_');
      param_arguments[parent_id[1]][name] = event.target.value; // TODO syntax check
      
      if (this.state.number_of_nodes === undefined) {
        this.state.number_of_nodes = Object.keys(this.state.nodes).length;
      }

      const line = param_arguments[parent_id[1]][name];

      if (line.length === 0) {
        element.classList = [];
      } else {
        axios
          .get("http://127.0.0.1:8000/check_syntax", { params:
              {
                line : line,
                nodes: this.state.nodes,
                n : this.state.number_of_nodes,
                } })
          .then(response => {
            if (response.data === true) {
              element.classList = ['greenshadow'];
            } else {
              element.classList = ['redshadow'];
            }
        });
      }
    };

    handleBackButton = event => {
      this.setState({ value : StateApp.LoadAeon });
    };

    handleNodesButton = event => {

      const greens = document.getElementsByClassName('greenshadow');
      if (greens.length != this.state.param_count * this.state.params.size) {
        this.openModal();
        return;
      }

      event.preventDefault();
      this.setState({ compute : true });

      if (this.state.params !== undefined) {
        for (var c = 0; c < this.state.param_count; ++c) {
          this.state.params.forEach((value, key) => {
            
            const expresion_arr = value["expr"].split("___parametrization___");
            var expr_snd = '';
            if (expresion_arr.length > 1) {
              expr_snd = expresion_arr[1];
            }

            if (param_lines[c] === undefined) {
              param_lines[c] = []
            }

            param_lines[c].push( "$" + key + " : " + expresion_arr[0] + " " + param_arguments[c][key] + " " + expr_snd );
          });
        }
      }
    };

     handleOnChange = (event, name) => {
      var checked = this.state.checked_nodes;

      if (event.target.checked) {
        checked.push(name);
      } else {
        checked = checked.filter(function(value) {
          return value === name;
        });
      }
      this.setState({ checked_nodes: checked });
    };

    handleNoSave = () => {
      this.setState({ asked : true });
    }

    handleSave = () => {
      const element = document.createElement("a");

      const file = new Blob([this.state.clusters],
        {
          type:"text/plain;charset=utf-8"
        });

      element.href = URL.createObjectURL(file);
      element.download = "data.json";
      document.body.appendChild(element);
      element.click();

      this.setState({ asked : true });
    }

    addParam = (event) => {
      event.preventDefault();
      this.setState({ param_count : this.state.param_count + 1 });
    }

    hideParam = (event, c) => {
      event.preventDefault();
      var shouldHide = this.state.shouldHide;
      shouldHide[c] = true;
      this.setState({ shouldHide: shouldHide, param_count : this.state.param_count - 1 });
    }

    openModal = (event) => {
      this.setState({ isOpen : true });
    }

    closeModal = (event) => {
      this.setState({ isOpen : false });
    }

  render() { 

    if (this.state.value === StateApp.MainApp) {
      return <App />
    }

    if (this.state.value === StateApp.LoadAeon) {
      return <LoadAeon />
    }

    if (this.state.value === StateApp.Visualise) {

          // Ask to save data
          const clusters_parsed = JSON.parse(this.state.clusters);

          if (this.state.asked === true) {
            return <Visualise fileData={clusters_parsed} />;
          }
          return (
            <div>
              <div class="row height-100"></div>
              <div class="row height-200 ">
                <form onSubmit={this.handleSubmit}> 

                <div class="col-lg-6 btn wrapper" onClick={this.handleSave} >
                  <svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" fill="currentColor" class="bi bi-download" viewBox="0 0 16 16">
                    <path d="M.5 9.9a.5.5 0 0 1 .5.5v2.5a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-2.5a.5.5 0 0 1 1 0v2.5a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2v-2.5a.5.5 0 0 1 .5-.5z"/>
                    <path d="M7.646 11.854a.5.5 0 0 0 .708 0l3-3a.5.5 0 0 0-.708-.708L8.5 10.293V1.5a.5.5 0 0 0-1 0v8.793L5.354 8.146a.5.5 0 1 0-.708.708l3 3z"/>
                  </svg>
                  <br/>
                  <h3 class="wrapperh3">Download</h3>
                  <p>Download precomputed clusters as JSON file.</p>
                </div>

                <div class="col-lg-6 btn wrapper" onClick={this.handleNoSave} >
                  <svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" fill="currentColor" class="bi bi-arrow-right-square" viewBox="0 0 16 16">
                    <path fill-rule="evenodd" d="M15 2a1 1 0 0 0-1-1H2a1 1 0 0 0-1 1v12a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V2zM0 2a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2V2zm4.5 5.5a.5.5 0 0 0 0 1h5.793l-2.147 2.146a.5.5 0 0 0 .708.708l3-3a.5.5 0 0 0 0-.708l-3-3a.5.5 0 1 0-.708.708L10.293 7.5H4.5z"/>
                  </svg>
                  <br/>
                  <h3 class="wrapperh3">Only visualize</h3>
                  <p>Only visualise without saving precomputed data.</p>
                </div>

                </form>
              </div>
            </div>
                      
          );
    }  

    if (!this.state.nodes && this.props.file_read) {
        const data_params = {
          file_data : this.props.file_read.join(" %% "),
        };

        axios
            .get("http://127.0.0.1:8000/get_nodes", { params: data_params })
            .then(response => {
                const result = JSON.parse(response.data);
                this.setState({ nodes : result["nodes"] });

                if (result["parametrization"] !== undefined) {
                    this.setState({ params : new Map(Object.entries(result["parametrization"]))});
                }

            });
        return (
            <h3>Getting nodes</h3>
        );
    }

    if (this.state.nodes && this.state.compute === false) {

        var parametrization_selection;
        const counts = Array.from(Array(this.state.param_count).keys());

        if (this.state.params !== undefined) {

          counts.forEach((c) => {
            if (param_arguments[c] === undefined) {
              param_arguments[c] = {};
            }
          });

          if (this.state.shouldHide === undefined) {
            this.state.shouldHide = counts.map( x => false );
          }

          if (this.state.shouldHide.length < counts.length) {
            for (let i = 0; i < counts.length - this.state.shouldHide.length; i++) {
                this.state.shouldHide.push(false);
            }
          }

          var lis = [];
          this.state.params.forEach((value, name) => {
            const args = value["args"].split(',');

            lis.push(
                <li key={name}>
                  <b>{name}</b>:
                  <br/>
                  <i>expression</i>: {value["expr"]}
                  <br/>
                  <i>can be parametrized by:</i> {value["args"]}
                  <br/>
                  <input type="text" name={name} id={name} onChange={this.handleCheckSyntax}/>
                </li>);
          });

            parametrization_selection = <div className="App">
                                            <h3>Add parametrization</h3>
                                            <p>
                                              Your expression will be added instead of '___parametrization___'.
                                            </p>
                                            <div class="row back">
                                            {
                                              counts.map(c => {
                                                var minus;
                                                if (c == counts.length - 1 && c != 0) {
                                                  minus = (
                                                    <span class="col-lg-1" title="Delete parametrization" >
                                                      <svg xmlns="http://www.w3.org/2000/svg"  onClick={(e) => this.hideParam(e, c)} width="25" height="25" fill="currentColor" class="bi bi-file-minus" viewBox="0 0 16 16">
                                                        <path d="M5.5 8a.5.5 0 0 1 .5-.5h4a.5.5 0 0 1 0 1H6a.5.5 0 0 1-.5-.5z"/>
                                                        <path d="M4 0a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V2a2 2 0 0 0-2-2H4zm0 1h8a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1z"/>
                                                      </svg>
                                                    </span>
                                                  );
                                                }

                                                return (
                                                <div class="col back" className={this.state.shouldHide[c] === true ? 'hidden' : undefined}>
                                                  <h5>
                                                    No. {c + 1} &nbsp; {minus}
                                                  </h5>
                                                  <ul id={'param_' + c}>
                                                    {
                                                      lis.map(li => {
                                                        return li;
                                                      }, this)
                                                    }
                                                  </ul>
                                                </div>);
                                              }, this)
                                            }
                                              <div class="col-lg-1" onClick={this.addParam} title="Add parametrization" >
                                                <svg xmlns="http://www.w3.org/2000/svg" width="50" height="50" fill="currentColor" class="bi bi-file-plus-fill" viewBox="0 0 16 16">
                                                <path d="M12 0H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V2a2 2 0 0 0-2-2zM8.5 6v1.5H10a.5.5 0 0 1 0 1H8.5V10a.5.5 0 0 1-1 0V8.5H6a.5.5 0 0 1 0-1h1.5V6a.5.5 0 0 1 1 0z"/>
                                                </svg>
                                              </div>
                                            </div>
                                          </div>
            }
    }

    if (this.state.nodes && (!this.state.parsed_nodes_keys || this.state.parsed_nodes_keys === null)) {
        const nodes_keys = Object.keys(this.state.nodes);
        this.setState({parsed_nodes_keys : nodes_keys});
    }

    if (this.state.parsed_nodes_keys && this.state.compute === false) {

        const nodes_selection = <div className="App">
                                <h3>Select nodes</h3>
                                {this.state.parsed_nodes_keys.map(name => {
                                    return (
                                    <div>
                                        <input
                                        type="checkbox"
                                        id={`custom-checkbox-${name}`}
                                        name={name}
                                        value={name}
                                        onChange={ (event) => { this.handleOnChange(event, name) }}
                                        class="cblack"
                                        />
                                        <label htmlFor={`custom-checkbox-${name}`}>&nbsp;{name}</label>
                                    </div>
                                    );
                                })}
                            </div>;
    

        return (
            <div class="back">

              {this.state.isOpen &&
                  <div>
                    <div class="overlay_styles"/>
                    <div class="modal_styles">
                      <div class="row centeredTopRight" onClick={this.closeModal}>
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" class="bi bi-x-square-fill" viewBox="0 0 16 16">
                          <path d="M2 0a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V2a2 2 0 0 0-2-2H2zm3.354 4.646L8 7.293l2.646-2.647a.5.5 0 0 1 .708.708L8.707 8l2.647 2.646a.5.5 0 0 1-.708.708L8 8.707l-2.646 2.647a.5.5 0 0 1-.708-.708L7.293 8 4.646 5.354a.5.5 0 1 1 .708-.708z"/>
                        </svg>
                      </div>

                      <div class="row">
                        <div class="col-3">
                        <svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" fill="currentColor" class="bi bi-exclamation" viewBox="0 0 16 16">
                          <path d="M7.002 11a1 1 0 1 1 2 0 1 1 0 0 1-2 0zM7.1 4.995a.905.905 0 1 1 1.8 0l-.35 3.507a.553.553 0 0 1-1.1 0L7.1 4.995z"/>
                        </svg>
                        </div>
                        <div class="col-6">
                          Some parametrizations are not written correctly.
                        </div>
                      </div>
                    </div>
                  </div>
              }
              <form>
                  {nodes_selection}
                  {parametrization_selection}

              </form>
              <br/>
                <div class="row">
                  <div className="App">
                    <button type="submit" value="Send" class="center btn-dark btn-sm btn " onClick={this.handleNodesButton} >
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-send-fill" viewBox="0 0 16 16">
                        <path d="M15.964.686a.5.5 0 0 0-.65-.65L.767 5.855H.766l-.452.18a.5.5 0 0 0-.082.887l.41.26.001.002 4.995 3.178 3.178 4.995.002.002.26.41a.5.5 0 0 0 .886-.083l6-15Zm-1.833 1.89L6.637 10.07l-.215-.338a.5.5 0 0 0-.154-.154l-.338-.215 7.494-7.494 1.178-.471-.47 1.178Z"/>
                      </svg>
                      &nbsp;Send
                    </button>
                  </div>
                  </div>
              <div class="row back">
                <div class="col-lg-2">
                  <input type="submit" value="Back" class="btn-dark btn-md btn" onClick={this.handleBackButton} />
                </div>
              </div>
            </div>
        );                      
    }

    if (this.state.compute) {
        const result_data_joined = this.props.file_read.join(" %% ");

        const nodes = this.state.checked_nodes.join(',');
        var data_params = {
            file_data: result_data_joined,
            semantics: (this.props.async ? (this.props.sync ? "async,sync" : "async") : "sync"),
            nodes: nodes
        }
        
        if (param_lines !== {}) {
            const param_lines_json = JSON.stringify(param_lines);
            data_params['params'] = param_lines_json;              
        }

        axios
            .get("http://127.0.0.1:8000/get_data/", { params: data_params })
            .then(response => {
                this.setState({ clusters : response.data });
                this.setState({ value : StateApp.Visualise });
            });

        return (
        <div class="row">
          <div class="col-4-lg btn wrapper"></div>
          <div class="col-4-lg btn wrapper">
              <svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" fill="currentColor" class="bi bi-cup-hot-fill" viewBox="0 0 16 16">
                <path fill-rule="evenodd" d="M.5 6a.5.5 0 0 0-.488.608l1.652 7.434A2.5 2.5 0 0 0 4.104 16h5.792a2.5 2.5 0 0 0 2.44-1.958l.131-.59a3 3 0 0 0 1.3-5.854l.221-.99A.5.5 0 0 0 13.5 6H.5ZM13 12.5a2.01 2.01 0 0 1-.316-.025l.867-3.898A2.001 2.001 0 0 1 13 12.5Z"/>
                <path d="m4.4.8-.003.004-.014.019a4.167 4.167 0 0 0-.204.31 2.327 2.327 0 0 0-.141.267c-.026.06-.034.092-.037.103v.004a.593.593 0 0 0 .091.248c.075.133.178.272.308.445l.01.012c.118.158.26.347.37.543.112.2.22.455.22.745 0 .188-.065.368-.119.494a3.31 3.31 0 0 1-.202.388 5.444 5.444 0 0 1-.253.382l-.018.025-.005.008-.002.002A.5.5 0 0 1 3.6 4.2l.003-.004.014-.019a4.149 4.149 0 0 0 .204-.31 2.06 2.06 0 0 0 .141-.267c.026-.06.034-.092.037-.103a.593.593 0 0 0-.09-.252A4.334 4.334 0 0 0 3.6 2.8l-.01-.012a5.099 5.099 0 0 1-.37-.543A1.53 1.53 0 0 1 3 1.5c0-.188.065-.368.119-.494.059-.138.134-.274.202-.388a5.446 5.446 0 0 1 .253-.382l.025-.035A.5.5 0 0 1 4.4.8Zm3 0-.003.004-.014.019a4.167 4.167 0 0 0-.204.31 2.327 2.327 0 0 0-.141.267c-.026.06-.034.092-.037.103v.004a.593.593 0 0 0 .091.248c.075.133.178.272.308.445l.01.012c.118.158.26.347.37.543.112.2.22.455.22.745 0 .188-.065.368-.119.494a3.31 3.31 0 0 1-.202.388 5.444 5.444 0 0 1-.253.382l-.018.025-.005.008-.002.002A.5.5 0 0 1 6.6 4.2l.003-.004.014-.019a4.149 4.149 0 0 0 .204-.31 2.06 2.06 0 0 0 .141-.267c.026-.06.034-.092.037-.103a.593.593 0 0 0-.09-.252A4.334 4.334 0 0 0 6.6 2.8l-.01-.012a5.099 5.099 0 0 1-.37-.543A1.53 1.53 0 0 1 6 1.5c0-.188.065-.368.119-.494.059-.138.134-.274.202-.388a5.446 5.446 0 0 1 .253-.382l.025-.035A.5.5 0 0 1 7.4.8Zm3 0-.003.004-.014.019a4.077 4.077 0 0 0-.204.31 2.337 2.337 0 0 0-.141.267c-.026.06-.034.092-.037.103v.004a.593.593 0 0 0 .091.248c.075.133.178.272.308.445l.01.012c.118.158.26.347.37.543.112.2.22.455.22.745 0 .188-.065.368-.119.494a3.198 3.198 0 0 1-.202.388 5.385 5.385 0 0 1-.252.382l-.019.025-.005.008-.002.002A.5.5 0 0 1 9.6 4.2l.003-.004.014-.019a4.149 4.149 0 0 0 .204-.31 2.06 2.06 0 0 0 .141-.267c.026-.06.034-.092.037-.103a.593.593 0 0 0-.09-.252A4.334 4.334 0 0 0 9.6 2.8l-.01-.012a5.099 5.099 0 0 1-.37-.543A1.53 1.53 0 0 1 9 1.5c0-.188.065-.368.119-.494.059-.138.134-.274.202-.388a5.446 5.446 0 0 1 .253-.382l.025-.035A.5.5 0 0 1 10.4.8Z"/>
              </svg>
              <h3 class="wrapperh3">Sending request</h3>
          </div>
          <div class="col-4-lg btn wrapper"></div>
        </div>
        );
    }        
          
    return (
    <div class="row">
      <div class="col-4-lg btn wrapper"></div>
      <div class="col-4-lg btn wrapper">
          <svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" fill="currentColor" class="bi bi-cup-hot-fill" viewBox="0 0 16 16">
            <path fill-rule="evenodd" d="M.5 6a.5.5 0 0 0-.488.608l1.652 7.434A2.5 2.5 0 0 0 4.104 16h5.792a2.5 2.5 0 0 0 2.44-1.958l.131-.59a3 3 0 0 0 1.3-5.854l.221-.99A.5.5 0 0 0 13.5 6H.5ZM13 12.5a2.01 2.01 0 0 1-.316-.025l.867-3.898A2.001 2.001 0 0 1 13 12.5Z"/>
            <path d="m4.4.8-.003.004-.014.019a4.167 4.167 0 0 0-.204.31 2.327 2.327 0 0 0-.141.267c-.026.06-.034.092-.037.103v.004a.593.593 0 0 0 .091.248c.075.133.178.272.308.445l.01.012c.118.158.26.347.37.543.112.2.22.455.22.745 0 .188-.065.368-.119.494a3.31 3.31 0 0 1-.202.388 5.444 5.444 0 0 1-.253.382l-.018.025-.005.008-.002.002A.5.5 0 0 1 3.6 4.2l.003-.004.014-.019a4.149 4.149 0 0 0 .204-.31 2.06 2.06 0 0 0 .141-.267c.026-.06.034-.092.037-.103a.593.593 0 0 0-.09-.252A4.334 4.334 0 0 0 3.6 2.8l-.01-.012a5.099 5.099 0 0 1-.37-.543A1.53 1.53 0 0 1 3 1.5c0-.188.065-.368.119-.494.059-.138.134-.274.202-.388a5.446 5.446 0 0 1 .253-.382l.025-.035A.5.5 0 0 1 4.4.8Zm3 0-.003.004-.014.019a4.167 4.167 0 0 0-.204.31 2.327 2.327 0 0 0-.141.267c-.026.06-.034.092-.037.103v.004a.593.593 0 0 0 .091.248c.075.133.178.272.308.445l.01.012c.118.158.26.347.37.543.112.2.22.455.22.745 0 .188-.065.368-.119.494a3.31 3.31 0 0 1-.202.388 5.444 5.444 0 0 1-.253.382l-.018.025-.005.008-.002.002A.5.5 0 0 1 6.6 4.2l.003-.004.014-.019a4.149 4.149 0 0 0 .204-.31 2.06 2.06 0 0 0 .141-.267c.026-.06.034-.092.037-.103a.593.593 0 0 0-.09-.252A4.334 4.334 0 0 0 6.6 2.8l-.01-.012a5.099 5.099 0 0 1-.37-.543A1.53 1.53 0 0 1 6 1.5c0-.188.065-.368.119-.494.059-.138.134-.274.202-.388a5.446 5.446 0 0 1 .253-.382l.025-.035A.5.5 0 0 1 7.4.8Zm3 0-.003.004-.014.019a4.077 4.077 0 0 0-.204.31 2.337 2.337 0 0 0-.141.267c-.026.06-.034.092-.037.103v.004a.593.593 0 0 0 .091.248c.075.133.178.272.308.445l.01.012c.118.158.26.347.37.543.112.2.22.455.22.745 0 .188-.065.368-.119.494a3.198 3.198 0 0 1-.202.388 5.385 5.385 0 0 1-.252.382l-.019.025-.005.008-.002.002A.5.5 0 0 1 9.6 4.2l.003-.004.014-.019a4.149 4.149 0 0 0 .204-.31 2.06 2.06 0 0 0 .141-.267c.026-.06.034-.092.037-.103a.593.593 0 0 0-.09-.252A4.334 4.334 0 0 0 9.6 2.8l-.01-.012a5.099 5.099 0 0 1-.37-.543A1.53 1.53 0 0 1 9 1.5c0-.188.065-.368.119-.494.059-.138.134-.274.202-.388a5.446 5.446 0 0 1 .253-.382l.025-.035A.5.5 0 0 1 10.4.8Z"/>
          </svg>
          <h3 class="wrapperh3">Waiting for computation</h3>
      </div>
      <div class="col-4-lg btn wrapper"></div>
    </div>
    );


  }
}
 
export default ChooseConfig;

