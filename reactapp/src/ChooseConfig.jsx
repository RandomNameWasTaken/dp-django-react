import './App.css';
import React from 'react';
import Visualise from './Visualise';
import { StateApp } from './StateApp.ts';
import axios from "axios";


let param_arguments = {};
let param_lines = {};

function get_select_fun(fun, name) {
  return (
    <select name={name} id={name} onClick={fun}>
      <option value="&"> & </option>
      <option value="|"> | </option>
      <option value="->"> -&gt; </option>
      <option value="<=>"> &lt;=&gt; </option>
    </select>
  );
}

function choose_parametrization(fun, args, regulations, nodes, name) {
  var result = [];
  args.forEach(function (arg, index) {
    if (result.length > 0) {
      result.push(get_select_fun(fun, name + "_" + index))
    }

    if (regulations[nodes[name]][nodes[arg]] === '-') {
      result.push('!')
    }

    result.push(arg)
  });

  return result.map(arg => { return arg; });
}


class ChooseConfig extends React.Component {
  state = {
    value : this.props.value || StateApp.ChooseConfig,

    checked_nodes : [],

    compute: false,
    asked : false,

    param_arguments: {},

    param_count : 1,
  };


   handleParams = (event) => {
      const id_arr = event.currentTarget.id.split('_');
      const name = id_arr[0];
      const index = id_arr[1];

      const element = event.target;
      const parent_id = element.closest("ul").getAttribute("id").split('_');

      param_arguments[parent_id[1]][name][index - 1] = event.target.value; // TODO spravny operator
    };

    handleBackButton = event => {
      this.setState({ value : StateApp.LoadAeon });
    };

    handleNodesButton = event => {
      event.preventDefault();
      this.render();

      this.setState({ compute : true });

      if (this.state.params !== undefined) {
        for (var c = 0; c < this.state.param_count; ++c) {
          this.state.params.forEach((value, key) => {
            
            var args_concat = '';
            var args = value["args"].split(',');
            for (var i = 0; i < args.length; ++i) {
              if (args_concat.length > 0) {
                args_concat += " " + param_arguments[c][key][ i - 1 ] + " ";
              }
              args_concat += args[i];
            }

            const expresion_arr = value["expr"].split("___parametrization___");
            var expr_snd = '';
            if (expresion_arr.length > 1) {
              expr_snd = expresion_arr[1];
            }

            if (param_lines[c] === undefined) {
              param_lines[c] = []
            }

            param_lines[c].push( "$" + key + " : " + expresion_arr[0] + " " + args_concat + " " + expr_snd);
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



  render() { 

    if (this.state.value === StateApp.Visualise) {

          // Ask to save data
          const clusters_parsed = JSON.parse(this.state.clusters);

          if (this.state.asked === true) {
            return <Visualise fileData={clusters_parsed} />;
          }
          return (
            <div>
              <h3>Do you want to save json file before visualisation?</h3>
              <br/>
              <button onClick={this.handleSave}>Yes</button>
              <button onClick={this.handleNoSave}>No, only visualise</button>

            </div>
          );
    }  

    if (!this.state.nodes) {
        axios
            .get("http://127.0.0.1:8000/get_nodes")
            .then(response => {
                const result = JSON.parse(response.data);
                this.setState({ nodes : result["nodes"] });

                if (result["parametrization"] !== undefined) {
                    this.setState({ params : new Map(Object.entries(result["parametrization"])), reguls : result["regulations"] });
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
  
            var lis = [];
            this.state.params.forEach((value, name) => {
            const args = value["args"].split(',');
            const choose_param = choose_parametrization(this.handleParams, args, this.state.reguls, this.state.nodes, name);

            const expresion_arr = value["expr"].split("___parametrization___");
            var expr_snd = '';
            if (expresion_arr.length > 1) {
                expr_snd = expresion_arr[1];
            }

            for (var c = 0; c < this.state.param_count; ++c) {
                if (param_arguments[c] === undefined) {
                param_arguments[c] = {}
                }
                if (param_arguments[c][name] === undefined) {
                param_arguments[c][name] = args.map( arg => "&" );
                param_arguments[c][name].pop();
                }
            }

            lis.push(<li key={name}> {name}: {expresion_arr[0]}&nbsp;{choose_param}&nbsp;{expr_snd}</li>);
            });

            parametrization_selection = <div className="App">
                                            <h3>Select parametrizations</h3>
                                            <div class="row">
                                            {
                                              counts.map(c => {
                                                return (
                                                <div class="col">
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
                                            
                                            <button class="col" onClick={this.addParam}> + </button>
                                            </div>
                                          </div>
            }
    }

    if (!this.state.parsed_nodes_keys || this.state.parsed_nodes_keys === null) {
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
                                        />
                                        <label htmlFor={`custom-checkbox-${name}`}>{name}</label>
                                    </div>
                                    );
                                })}
                            </div>;
    

        return (
            <div>
            <form>
                {nodes_selection}
                {parametrization_selection}
                <input type="submit" value="Send" onClick={this.handleNodesButton} />
            </form>
            </div>
        );                      
    }

    if (this.state.compute) {
        const result_data_joined = this.props.file_read.join(" %% ");

        document.cookie = "resultData=" + result_data_joined + "; SameSite=None; Secure";

        const nodes = this.state.checked_nodes.join(',');

        var data_params = {
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
        <div>
            <h3>Sending request</h3>
        </div>
        );
    }        
          
    return (
    <div>
        <h3>Waiting for computation</h3>
    </div>
    );

  }
}
 
export default ChooseConfig;

