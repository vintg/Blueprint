import React, { Component } from 'react';
import axios from 'axios';

import InputForm from './components/inputForm';
import Charts from './components/chart';
import Summary from './components/summary';

export class App extends Component {
  constructor() {
    super();
    this.state = {
      rate_type: 0,
      rate: 0.12,
      address: '',
      lat: 0,
      lon: 0,
      system_capacity: 25,
      azimuth: 180,
      tilt: 25,
      array_type: 1,
      module_type: 1,
      eff_losses: 13,
      view: 0,
      chartData: {},
      annual_solar: 0,
      ac_energy: 0,
      electricity_value: 0,
      mapURL: ''
    };
    this.handleInputChange = this.handleInputChange.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
    this.changeView = this.changeView.bind(this);
  }

  handleInputChange(e){
    this.setState({
      [e.target.name]: e.target.value
    });
  }

  handleSubmit(){
    axios.get('/address', {
      params: {
          address: this.state.address
        }
    }).then(res => {
      const coords = res.data[0].locations[1];
      const latitude = coords.latLng.lat;
      const longitude = coords.latLng.lng;
      const mapURL = coords.mapUrl;

      axios.get('/calculate',{
        params: {
          lat: latitude,
          lon: longitude,
          system_capacity: this.state.system_capacity,
          azimuth: this.state.azimuth,
          tilt: this.state.tilt,
          array_type: this.state.array_type,
          module_type: this.state.module_type,
          eff_losses: this.state.eff_losses,
        }
      }).then(res => {
          this.setState({
            chartData: this.preprocess(res.data)
          })
      }).catch((err)=> console.log(err));
    }).catch((err)=> console.log(err));

    this.changeView();
  }

  preprocess(data) { console.log(data);
    this.setState({
      annual_solar: Number(data.solrad_annual.toFixed(3)),
      ac_energy: Number(data.ac_annual.toFixed(3)),
      electricity_value: Number((this.state.rate*data.ac_annual).toFixed(3))
    });
    const d = new Date();
    const start = d.getMonth();
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const xlabel = [];
    for (let i = start; i<start+12;i++){
      xlabel.push(months[i%12]);
    }
    return {
      ac:{
      labels: xlabel,
      datasets: [{
          label: 'AC 1-YR',
            backgroundColor: "rgba(66,134,244,0.3)",
            borderColor: "rgba(75,192,192,1)",
            borderCapStyle: 'butt',
            borderDash: [],
            borderDashOffset: 0.0,
            borderJoinStyle: 'miter',
            pointBorderColor: "rgba(75,192,192,1)",
            pointBackgroundColor: "#fff",
            pointBorderWidth: 1,
            pointHoverRadius: 10,
            pointHoverBackgroundColor: "rgba(75,192,192,1)",
            pointHoverBorderColor: "rgba(220,220,220,1)",
            pointHoverBorderWidth: 2,
            pointRadius: 1,
            pointHitRadius: 10,
          data: data.ac_monthly
        }]
      },
      solar:{
        labels: xlabel,
        datasets: [{
          label: 'Solar Radiation 1-YR',
            backgroundColor: "rgba(255,203,5,0.3)",
            borderColor: "rgba(255, 203, 5, 1)",
            borderCapStyle: 'butt',
            borderDash: [],
            borderDashOffset: 0.0,
            borderJoinStyle: 'miter',
            pointBorderColor: "rgba(255, 203, 5, 1)",
            pointBackgroundColor: "#fff",
            pointBorderWidth: 1,
            pointHoverRadius: 10,
            pointHoverBackgroundColor: "rgba(255, 203, 5, 1)",
            pointHoverBorderColor: "rgba(248, 148, 6, 1)",
            pointHoverBorderWidth: 2,
            pointRadius: 1,
            pointHitRadius: 10,
          data: data.solrad_monthly
        }]
      }
    };
  }

  changeView(){
    this.setState({
      view: (this.state.view+1)%2
    });
  }

  renderView(){
    const view = this.state.view;
    if(view === 0){
      return <InputForm
        handleInputChange={this.handleInputChange}
        handleSubmit={this.handleSubmit}
      />
    } else {
      return (
        <div>
        <Charts data={this.state.chartData.ac}/>
        <Charts data={this.state.chartData.solar}/>
        <Summary
           annSol={this.state.annual_solar}
           ac={this.state.ac_energy}
           ev={this.state.electricity_value}
           changeView={this.changeView}
        />
        </div>
      )
    }
  }

  render() {
    return (
      <div className="wrapper">
        {this.renderView()}
      </div>
    );
  }
};
