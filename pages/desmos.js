
var elt = document.getElementById('calculator');
var calculator = Desmos.GraphingCalculator(elt, {
  invertedColors: true,
  pasteGraphLink: true,
  // expressions: false,
  settingsMenu: false,
  showGrid: false,
  zoomFit: true
});

var desmosCycloidState = {
"version": 9,
"graph": {
  "viewport": {
  "xmin": -4.1,
  "ymin": -2.2,
  "xmax": 4.1,
  "ymax": 2.2
},
"showGrid": false
},
"expressions": {
 "list": [
  {
      "id": "56",
      "type": "expression",
      "latex": "c=0.41",
      "color": "#6042a6",
      "lineStyle": "SOLID",
      "lineWidth": "",
      "lineOpacity": "",
      "pointStyle": "POINT",
      "pointSize": "",
      "pointOpacity": "",
      "fillOpacity": "",
      "hidden": false,
      "secret": false,
      "dragMode": "AUTO",
      "label": "",
      "showLabel": false,
      "labelSize": "",
      "labelOrientation": "default",
      "interactiveLabel": false,
      "readonly": false,
      "parametricDomain": {
          "min": "",
          "max": ""
      },
      "polarDomain": {
          "min": "",
          "max": ""
      },
      "domain": {
          "min": "0",
          "max": "1"
      },
      "sliderBounds": {
          "min": "0",
          "max": "2\\pi"
      },
      "slider": {
        "animationPeriod": 40000,
        "isPlaying": true
      }
  },
  {
      "id": "3",
      "type": "expression",
      "latex": "R=1.8",
      "color": "#388c46",
      "lineStyle": "SOLID",
      "lineWidth": "",
      "lineOpacity": "",
      "pointStyle": "POINT",
      "pointSize": "",
      "pointOpacity": "",
      "fillOpacity": "",
      "hidden": true,
      "secret": false,
      "dragMode": "AUTO",
      "label": "",
      "showLabel": false,
      "labelSize": "",
      "labelOrientation": "default",
      "interactiveLabel": false,
      "readonly": false,
      "parametricDomain": {
          "min": "",
          "max": ""
      },
      "polarDomain": {
          "min": "",
          "max": ""
      },
      "domain": {
          "min": "0",
          "max": "1"
      },
      "sliderBounds": {
          "min": "0",
          "max": "20"
      },
      "playing": false
  },
  {
      "id": "11",
      "type": "expression",
      "latex": "S=0.1",
      "color": "#c74440",
      "lineStyle": "SOLID",
      "lineWidth": "",
      "lineOpacity": "",
      "pointStyle": "POINT",
      "pointSize": "",
      "pointOpacity": "",
      "fillOpacity": "",
      "hidden": true,
      "secret": false,
      "dragMode": "AUTO",
      "label": "",
      "showLabel": false,
      "labelSize": "",
      "labelOrientation": "default",
      "interactiveLabel": false,
      "readonly": false,
      "parametricDomain": {
          "min": "",
          "max": ""
      },
      "polarDomain": {
          "min": "",
          "max": ""
      },
      "domain": {
          "min": "0",
          "max": "1"
      },
      "sliderBounds": {
          "min": "0",
          "max": "6"
      },
      "playing": false
  },
  {
      "id": "7",
      "type": "expression",
      "latex": "N=28",
      "color": "#2d70b3",
      "lineStyle": "SOLID",
      "lineWidth": "",
      "lineOpacity": "",
      "pointStyle": "POINT",
      "pointSize": "",
      "pointOpacity": "",
      "fillOpacity": "",
      "hidden": true,
      "secret": false,
      "dragMode": "AUTO",
      "label": "",
      "showLabel": false,
      "labelSize": "",
      "labelOrientation": "default",
      "interactiveLabel": false,
      "readonly": false,
      "parametricDomain": {
          "min": "",
          "max": ""
      },
      "polarDomain": {
          "min": "",
          "max": ""
      },
      "domain": {
          "min": "0",
          "max": "1"
      },
      "sliderBounds": {
          "min": "0",
          "max": "50",
          "step": "2"
      },
      "playing": false
  },
  {
      "id": "8",
      "type": "expression",
      "latex": "E=\\frac{S}{2}",
      "color": "#388c46",
      "lineStyle": "SOLID",
      "lineWidth": "",
      "lineOpacity": "",
      "pointStyle": "POINT",
      "pointSize": "",
      "pointOpacity": "",
      "fillOpacity": "",
      "hidden": true,
      "secret": false,
      "dragMode": "AUTO",
      "label": "",
      "showLabel": false,
      "labelSize": "",
      "labelOrientation": "default",
      "interactiveLabel": false,
      "readonly": false,
      "parametricDomain": {
          "min": "",
          "max": ""
      },
      "polarDomain": {
          "min": "",
          "max": ""
      },
      "domain": {
          "min": "0",
          "max": "1"
      },
      "sliderBounds": {
          "min": "0",
          "max": "1"
      },
      "playing": false
  },
  {
      "id": "73",
      "type": "folder",
      "hidden": false,
      "secret": false
  },
  {
      "id": "13",
      "type": "expression",
      "latex": "f\\left(x\\right)=R\\cos\\left(x\\right)-S\\cos\\left(x-b\\right)-E\\cos\\left(Nx\\right)",
      "color": "#388c46",
      "lineStyle": "SOLID",
      "lineWidth": "",
      "lineOpacity": "",
      "pointStyle": "POINT",
      "pointSize": "",
      "pointOpacity": "",
      "fillOpacity": "",
      "hidden": true,
      "secret": false,
      "dragMode": "AUTO",
      "label": "",
      "showLabel": false,
      "labelSize": "",
      "labelOrientation": "default",
      "interactiveLabel": false,
      "readonly": false,
      "parametricDomain": {
          "min": "",
          "max": ""
      },
      "polarDomain": {
          "min": "",
          "max": ""
      },
      "domain": {
          "min": "0",
          "max": "1"
      },
      "playing": false
  },
  {
      "id": "14",
      "type": "expression",
      "latex": "g\\left(x\\right)=-R\\sin\\left(x\\right)+S\\sin\\left(x-b\\right)+E\\sin\\left(Nx\\right)",
      "color": "#6042a6",
      "lineStyle": "SOLID",
      "lineWidth": "",
      "lineOpacity": "",
      "pointStyle": "POINT",
      "pointSize": "",
      "pointOpacity": "",
      "fillOpacity": "",
      "hidden": true,
      "secret": false,
      "dragMode": "AUTO",
      "label": "",
      "showLabel": false,
      "labelSize": "",
      "labelOrientation": "default",
      "interactiveLabel": false,
      "readonly": false,
      "parametricDomain": {
          "min": "",
          "max": ""
      },
      "polarDomain": {
          "min": "",
          "max": ""
      },
      "domain": {
          "min": "0",
          "max": "1"
      },
      "playing": false
  },
  {
      "id": "19",
      "type": "expression",
      "latex": "b=-\\arctan\\left(\\frac{\\sin\\left(\\left(1-N\\right)x\\right)}{\\left(\\frac{R}{EN}\\right)-\\cos\\left(\\left(1-N\\right)x\\right)}\\right)",
      "color": "#6042a6",
      "lineStyle": "SOLID",
      "lineWidth": "",
      "lineOpacity": "",
      "pointStyle": "POINT",
      "pointSize": "",
      "pointOpacity": "",
      "fillOpacity": "",
      "hidden": true,
      "secret": false,
      "dragMode": "AUTO",
      "label": "",
      "showLabel": false,
      "labelSize": "",
      "labelOrientation": "default",
      "interactiveLabel": false,
      "readonly": false,
      "parametricDomain": {
          "min": "",
          "max": ""
      },
      "polarDomain": {
          "min": "",
          "max": ""
      },
      "domain": {
          "min": "0",
          "max": "1"
      },
      "playing": false
  },
  {
      "id": "20",
      "type": "expression",
      "latex": "\\left(f\\left(t\\right),g\\left(t\\right)\\right)",
      "color": "#2d70b3",
      "lineStyle": "SOLID",
      "lineWidth": "",
      "lineOpacity": "",
      "pointStyle": "POINT",
      "pointSize": "",
      "pointOpacity": "",
      "fillOpacity": "",
      "hidden": true,
      "secret": false,
      "dragMode": "AUTO",
      "label": "",
      "showLabel": false,
      "labelSize": "",
      "labelOrientation": "default",
      "interactiveLabel": false,
      "readonly": false,
      "parametricDomain": {
          "min": "",
          "max": "2\\pi"
      },
      "polarDomain": {
          "min": "",
          "max": ""
      },
      "domain": {
          "min": "0",
          "max": "2\\pi"
      },
      "playing": false
  },
  {
      "id": "53",
      "type": "expression",
      "latex": "a=\\left[1...N\\right]",
      "color": "#c74440",
      "lineStyle": "SOLID",
      "lineWidth": "",
      "lineOpacity": "",
      "pointStyle": "POINT",
      "pointSize": "",
      "pointOpacity": "",
      "fillOpacity": "",
      "hidden": false,
      "secret": false,
      "dragMode": "AUTO",
      "label": "",
      "showLabel": false,
      "labelSize": "",
      "labelOrientation": "default",
      "interactiveLabel": false,
      "readonly": false,
      "parametricDomain": {
          "min": "",
          "max": ""
      },
      "polarDomain": {
          "min": "",
          "max": ""
      },
      "domain": {
          "min": "0",
          "max": "1"
      },
      "playing": false
  },
  {
      "id": "51",
      "type": "expression",
      "latex": "\\left(x+R\\cos\\left(\\frac{2\\pi a}{N}\\right)+E\\right)^{2}+\\left(y+R\\sin\\left(\\frac{2\\pi a}{N}\\right)\\right)^{2}=S^{2}",
      "color": "#c74440",
      "lineStyle": "SOLID",
      "lineWidth": "",
      "lineOpacity": "",
      "pointStyle": "POINT",
      "pointSize": "",
      "pointOpacity": "",
      "fillOpacity": "",
      "hidden": false,
      "secret": false,
      "dragMode": "AUTO",
      "label": "",
      "showLabel": false,
      "labelSize": "",
      "labelOrientation": "default",
      "interactiveLabel": false,
      "readonly": false,
      "parametricDomain": {
          "min": "",
          "max": ""
      },
      "polarDomain": {
          "min": "",
          "max": ""
      },
      "domain": {
          "min": "0",
          "max": "1"
      },
      "playing": false
  },
  {
      "id": "68",
      "type": "expression",
      "latex": "\\left(0.75E\\cos t-E,0.75E\\sin t\\right)",
      "color": "#000000",
      "lineStyle": "SOLID",
      "lineWidth": "",
      "lineOpacity": "",
      "pointStyle": "POINT",
      "pointSize": "",
      "pointOpacity": "",
      "fillOpacity": "",
      "hidden": false,
      "secret": false,
      "dragMode": "AUTO",
      "label": "",
      "showLabel": false,
      "labelSize": "",
      "labelOrientation": "default",
      "interactiveLabel": false,
      "readonly": false,
      "parametricDomain": {
          "min": "",
          "max": "2\\pi"
      },
      "polarDomain": {
          "min": "",
          "max": "2\\pi"
      },
      "domain": {
          "min": "0",
          "max": "2\\pi"
      },
      "playing": false
  },
  {
      "id": "62",
      "type": "expression",
      "latex": "\\left(\\left(\\frac{1}{10}R+2E\\right)\\cos\\left(t\\right)+2m\\left(c\\right)-E,\\left(\\frac{1}{10}R+2E\\right)\\sin t+2m_{2}\\left(c\\right)\\right)",
      "color": "#000000",
      "lineStyle": "SOLID",
      "lineWidth": "",
      "lineOpacity": "",
      "pointStyle": "POINT",
      "pointSize": "",
      "pointOpacity": "",
      "fill": true,
      "fillOpacity": "0.4",
      "hidden": false,
      "secret": false,
      "dragMode": "AUTO",
      "label": "",
      "showLabel": false,
      "labelSize": "",
      "labelOrientation": "default",
      "interactiveLabel": false,
      "readonly": false,
      "parametricDomain": {
          "min": "",
          "max": "2\\pi"
      },
      "polarDomain": {
          "min": "",
          "max": ""
      },
      "domain": {
          "min": "0",
          "max": "2\\pi"
      },
      "playing": false
  },
  {
      "id": "69",
      "type": "expression",
      "latex": "\\left(\\left(\\frac{1}{10}R+E\\ +\\ S\\right)\\cos t-E+m\\left(c\\right),\\left(\\frac{1}{10}R+E\\ +\\ S\\right)\\sin t+m_{2}\\left(c\\right)\\right)",
      "color": "#dd704f",
      "lineStyle": "SOLID",
      "lineWidth": "",
      "lineOpacity": "",
      "pointStyle": "POINT",
      "pointSize": "",
      "pointOpacity": "",
      "fill": false,
      "fillOpacity": "0.4",
      "hidden": false,
      "secret": false,
      "dragMode": "AUTO",
      "label": "",
      "showLabel": false,
      "labelSize": "",
      "labelOrientation": "default",
      "interactiveLabel": false,
      "readonly": false,
      "parametricDomain": {
          "min": "",
          "max": "2\\pi"
      },
      "polarDomain": {
          "min": "",
          "max": ""
      },
      "domain": {
          "min": "0",
          "max": "2\\pi"
      },
      "playing": false
  },
  {
      "id": "61",
      "type": "expression",
      "latex": "(f\\left(t\\right)\\cdot\\cos\\left(c\\right)-g\\left(t\\right)\\sin\\left(c\\right)+m\\left(c\\right)-E\\ ,\\ f\\left(t\\right)\\cdot\\sin\\left(c\\right)+g\\left(t\\right)\\cdot\\cos\\left(c\\right)+m_{2}\\left(c\\right))",
      "color": "#cb3f14",
      "lineStyle": "SOLID",
      "lineWidth": "",
      "lineOpacity": "",
      "pointStyle": "POINT",
      "pointSize": "",
      "pointOpacity": "",
      "fill": true,
      "fillOpacity": "",
      "hidden": false,
      "secret": false,
      "dragMode": "AUTO",
      "label": "",
      "showLabel": false,
      "labelSize": "",
      "labelOrientation": "default",
      "interactiveLabel": false,
      "readonly": false,
      "parametricDomain": {
          "min": "",
          "max": "2\\pi"
      },
      "polarDomain": {
          "min": "",
          "max": ""
      },
      "domain": {
          "min": "0",
          "max": "2\\pi"
      },
      "playing": false
  },
  {
      "id": "101",
      "type": "expression",
      "latex": "m\\left(x\\right)=\\left(E\\cos\\left(x\\left(N-1\\right)\\right)\\right)",
      "color": "#388c46",
      "lineStyle": "SOLID",
      "lineWidth": "",
      "lineOpacity": "",
      "pointStyle": "POINT",
      "pointSize": "",
      "pointOpacity": "",
      "fillOpacity": "",
      "hidden": true,
      "secret": false,
      "dragMode": "AUTO",
      "label": "",
      "showLabel": false,
      "labelSize": "",
      "labelOrientation": "default",
      "interactiveLabel": false,
      "readonly": false,
      "parametricDomain": {
          "min": "",
          "max": ""
      },
      "polarDomain": {
          "min": "",
          "max": ""
      },
      "domain": {
          "min": "0",
          "max": "1"
      },
      "playing": false
  },
  {
      "id": "102",
      "type": "expression",
      "latex": "m_{2}\\left(x\\right)=-\\left(\\ E\\sin\\left(x\\left(N-1\\right)\\right)\\right)",
      "color": "#6042a6",
      "lineStyle": "SOLID",
      "lineWidth": "",
      "lineOpacity": "",
      "pointStyle": "POINT",
      "pointSize": "",
      "pointOpacity": "",
      "fillOpacity": "",
      "hidden": true,
      "secret": false,
      "dragMode": "AUTO",
      "label": "",
      "showLabel": false,
      "labelSize": "",
      "labelOrientation": "default",
      "interactiveLabel": false,
      "readonly": false,
      "parametricDomain": {
          "min": "",
          "max": ""
      },
      "polarDomain": {
          "min": "",
          "max": ""
      },
      "domain": {
          "min": "0",
          "max": "1"
      },
      "playing": false
  },
  {
      "id": "129",
      "type": "expression",
      "latex": "\\left(X,Y\\right)",
      "color": "#6042a6",
      "lineStyle": "SOLID",
      "lineWidth": "",
      "lineOpacity": "",
      "pointStyle": "POINT",
      "pointSize": "",
      "pointOpacity": "",
      "fill": true,
      "fillOpacity": "",
      "hidden": true,
      "secret": false,
      "dragMode": "AUTO",
      "label": "",
      "showLabel": false,
      "labelSize": "",
      "labelOrientation": "default",
      "interactiveLabel": false,
      "readonly": false,
      "parametricDomain": {
          "min": "",
          "max": "2\\pi"
      },
      "polarDomain": {
          "min": "",
          "max": ""
      },
      "domain": {
          "min": "0",
          "max": "2\\pi"
      },
      "playing": false
  },
  {
      "id": "130",
      "type": "expression",
      "latex": "X=R*\\cos(t)-S*\\cos(t+\\arctan((\\sin((1-N)*t))/(((R)/(E*N))-\\cos((1-N)*t))))-E*\\cos(N*t)",
      "color": "#000000",
      "lineStyle": "SOLID",
      "lineWidth": "",
      "lineOpacity": "",
      "pointStyle": "POINT",
      "pointSize": "",
      "pointOpacity": "",
      "fillOpacity": "",
      "hidden": true,
      "secret": false,
      "dragMode": "AUTO",
      "label": "",
      "showLabel": false,
      "labelSize": "",
      "labelOrientation": "default",
      "interactiveLabel": false,
      "readonly": false,
      "parametricDomain": {
          "min": "",
          "max": ""
      },
      "polarDomain": {
          "min": "",
          "max": ""
      },
      "domain": {
          "min": "0",
          "max": "1"
      },
      "playing": false
  },
  {
      "id": "131",
      "type": "expression",
      "latex": "Y=R*\\sin(t)-S*\\sin(t+\\arctan((\\sin((1-N)*t))/(((R)/(E*N))-\\cos((1-N)*t))))-E*\\sin(N*t)",
      "color": "#c74440",
      "lineStyle": "SOLID",
      "lineWidth": "",
      "lineOpacity": "",
      "pointStyle": "POINT",
      "pointSize": "",
      "pointOpacity": "",
      "fillOpacity": "",
      "hidden": true,
      "secret": false,
      "dragMode": "AUTO",
      "label": "",
      "showLabel": false,
      "labelSize": "",
      "labelOrientation": "default",
      "interactiveLabel": false,
      "readonly": false,
      "parametricDomain": {
          "min": "",
          "max": ""
      },
      "polarDomain": {
          "min": "",
          "max": ""
      },
      "domain": {
          "min": "0",
          "max": "1"
      },
      "playing": false
  },
  {
      "id": "139",
      "type": "expression",
      "latex": "",
      "color": "#2d70b3",
      "lineStyle": "SOLID",
      "lineWidth": "",
      "lineOpacity": "",
      "pointStyle": "POINT",
      "pointSize": "",
      "pointOpacity": "",
      "fillOpacity": "",
      "hidden": false,
      "secret": false,
      "dragMode": "AUTO",
      "label": "",
      "showLabel": false,
      "labelSize": "",
      "labelOrientation": "default",
      "interactiveLabel": false,
      "readonly": false,
      "parametricDomain": {
          "min": "",
          "max": ""
      },
      "polarDomain": {
          "min": "",
          "max": ""
      },
      "domain": {
          "min": "0",
          "max": "1"
      },
      "playing": false
  }
]
}
};

var liqPistonState = {
  "version": 9,
"graph": {
  "viewport": {
    "xmin": -10.3,
    "ymin": -10.3,
    "xmax": 10.3,
    "ymax": 10.3
  },
"showGrid": false
},
"expressions": {
  "list": [
    {
      "id": "9",
      "type": "expression",
      "latex": "C=6.28",
      "color": "#6042a6",
      "lineStyle": "SOLID",
      "lineWidth": "",
      "lineOpacity": "",
      "pointStyle": "POINT",
      "pointSize": "",
      "pointOpacity": "",
      "fillOpacity": "",
      "hidden": true,
      "secret": false,
      "dragMode": "AUTO",
      "label": "",
      "showLabel": false,
      "labelSize": "",
      "labelOrientation": "default",
      "interactiveLabel": false,
      "readonly": false,
      "parametricDomain": {
          "min": "",
          "max": ""
      },
      "parametricDomain3Du": {
          "min": "",
          "max": ""
      },
      "parametricDomain3Dv": {
          "min": "",
          "max": ""
      },
      "polarDomain": {
          "min": "",
          "max": ""
      },
      "domain": {
          "min": "0",
          "max": "1"
      },
      "sliderBounds": {
          "min": "0",
          "max": "2\\pi"
      },
      "playing": false
  },
  {
      "id": "1",
      "type": "expression",
      "latex": "f\\left(x\\right)=R\\cos\\left(x\\right)-S\\cos\\left(x-b\\right)-E\\cos\\left(Nx\\right)",
      "color": "#c74440",
      "lineStyle": "SOLID",
      "lineWidth": "",
      "lineOpacity": "",
      "pointStyle": "POINT",
      "pointSize": "",
      "pointOpacity": "",
      "fillOpacity": "",
      "hidden": true,
      "secret": false,
      "dragMode": "AUTO",
      "label": "",
      "showLabel": false,
      "labelSize": "",
      "labelOrientation": "default",
      "interactiveLabel": false,
      "readonly": false,
      "parametricDomain": {
          "min": "",
          "max": ""
      },
      "parametricDomain3Du": {
          "min": "",
          "max": ""
      },
      "parametricDomain3Dv": {
          "min": "",
          "max": ""
      },
      "polarDomain": {
          "min": "",
          "max": ""
      },
      "domain": {
          "min": "0",
          "max": "1"
      },
      "playing": false
  },
  {
      "id": "2",
      "type": "expression",
      "latex": "g\\left(x\\right)=-R\\sin\\left(x\\right)+S\\sin\\left(x-b\\right)+E\\sin\\left(Nx\\right)",
      "color": "#2d70b3",
      "lineStyle": "SOLID",
      "lineWidth": "",
      "lineOpacity": "",
      "pointStyle": "POINT",
      "pointSize": "",
      "pointOpacity": "",
      "fillOpacity": "",
      "hidden": true,
      "secret": false,
      "dragMode": "AUTO",
      "label": "",
      "showLabel": false,
      "labelSize": "",
      "labelOrientation": "default",
      "interactiveLabel": false,
      "readonly": false,
      "parametricDomain": {
          "min": "",
          "max": ""
      },
      "parametricDomain3Du": {
          "min": "",
          "max": ""
      },
      "parametricDomain3Dv": {
          "min": "",
          "max": ""
      },
      "polarDomain": {
          "min": "",
          "max": ""
      },
      "domain": {
          "min": "0",
          "max": "1"
      },
      "playing": false
  },
  {
      "id": "3",
      "type": "expression",
      "latex": "b=-\\arctan\\left(\\frac{\\sin\\left(\\left(1-N\\right)x\\right)}{\\left(\\frac{R}{EN}\\right)-\\cos\\left(\\left(1-N\\right)x\\right)}\\right)",
      "color": "#388c46",
      "lineStyle": "SOLID",
      "lineWidth": "",
      "lineOpacity": "",
      "pointStyle": "POINT",
      "pointSize": "",
      "pointOpacity": "",
      "fillOpacity": "",
      "hidden": true,
      "secret": false,
      "dragMode": "AUTO",
      "label": "",
      "showLabel": false,
      "labelSize": "",
      "labelOrientation": "default",
      "interactiveLabel": false,
      "readonly": false,
      "parametricDomain": {
          "min": "",
          "max": ""
      },
      "parametricDomain3Du": {
          "min": "",
          "max": ""
      },
      "parametricDomain3Dv": {
          "min": "",
          "max": ""
      },
      "polarDomain": {
          "min": "",
          "max": ""
      },
      "domain": {
          "min": "0",
          "max": "1"
      },
      "playing": false
  },
  {
      "id": "4",
      "type": "expression",
      "latex": "\\left(f\\left(t\\right),g\\left(t\\right)\\right)",
      "color": "#af8255",
      "lineStyle": "SOLID",
      "lineWidth": "",
      "lineOpacity": "",
      "pointStyle": "POINT",
      "pointSize": "",
      "pointOpacity": "",
      "fillOpacity": "",
      "hidden": false,
      "secret": false,
      "dragMode": "AUTO",
      "label": "",
      "showLabel": false,
      "labelSize": "",
      "labelOrientation": "default",
      "interactiveLabel": false,
      "readonly": false,
      "parametricDomain": {
          "min": "",
          "max": "C"
      },
      "parametricDomain3Du": {
          "min": "",
          "max": ""
      },
      "parametricDomain3Dv": {
          "min": "",
          "max": ""
      },
      "polarDomain": {
          "min": "",
          "max": ""
      },
      "domain": {
          "min": "0",
          "max": "C"
      },
      "playing": false
  },
  {
      "id": "7",
      "type": "expression",
      "latex": "N=4",
      "color": "#2d70b3",
      "lineStyle": "SOLID",
      "lineWidth": "",
      "lineOpacity": "",
      "pointStyle": "POINT",
      "pointSize": "",
      "pointOpacity": "",
      "fillOpacity": "",
      "hidden": true,
      "secret": false,
      "dragMode": "AUTO",
      "label": "",
      "showLabel": false,
      "labelSize": "",
      "labelOrientation": "default",
      "interactiveLabel": false,
      "readonly": false,
      "parametricDomain": {
          "min": "",
          "max": ""
      },
      "parametricDomain3Du": {
          "min": "",
          "max": ""
      },
      "parametricDomain3Dv": {
          "min": "",
          "max": ""
      },
      "polarDomain": {
          "min": "",
          "max": ""
      },
      "domain": {
          "min": "0",
          "max": "1"
      },
      "playing": false
  },
  {
      "id": "8",
      "type": "expression",
      "latex": "E=\\frac{S}{2}",
      "color": "#388c46",
      "lineStyle": "SOLID",
      "lineWidth": "",
      "lineOpacity": "",
      "pointStyle": "POINT",
      "pointSize": "",
      "pointOpacity": "",
      "fillOpacity": "",
      "hidden": true,
      "secret": false,
      "dragMode": "AUTO",
      "label": "",
      "showLabel": false,
      "labelSize": "",
      "labelOrientation": "default",
      "interactiveLabel": false,
      "readonly": false,
      "parametricDomain": {
          "min": "",
          "max": ""
      },
      "parametricDomain3Du": {
          "min": "",
          "max": ""
      },
      "parametricDomain3Dv": {
          "min": "",
          "max": ""
      },
      "polarDomain": {
          "min": "",
          "max": ""
      },
      "domain": {
          "min": "0",
          "max": "1"
      },
      "playing": false
  },
  {
      "id": "6",
      "type": "expression",
      "latex": "S=3",
      "color": "#c74440",
      "lineStyle": "SOLID",
      "lineWidth": "",
      "lineOpacity": "",
      "pointStyle": "POINT",
      "pointSize": "",
      "pointOpacity": "",
      "fillOpacity": "",
      "hidden": true,
      "secret": false,
      "dragMode": "AUTO",
      "label": "",
      "showLabel": false,
      "labelSize": "",
      "labelOrientation": "default",
      "interactiveLabel": false,
      "readonly": false,
      "parametricDomain": {
          "min": "",
          "max": ""
      },
      "parametricDomain3Du": {
          "min": "",
          "max": ""
      },
      "parametricDomain3Dv": {
          "min": "",
          "max": ""
      },
      "polarDomain": {
          "min": "",
          "max": ""
      },
      "domain": {
          "min": "0",
          "max": "1"
      },
      "playing": false
  },
  {
      "id": "5",
      "type": "expression",
      "latex": "R=11",
      "color": "#000000",
      "lineStyle": "SOLID",
      "lineWidth": "",
      "lineOpacity": "",
      "pointStyle": "POINT",
      "pointSize": "",
      "pointOpacity": "",
      "fillOpacity": "",
      "hidden": true,
      "secret": false,
      "dragMode": "AUTO",
      "label": "",
      "showLabel": false,
      "labelSize": "",
      "labelOrientation": "default",
      "interactiveLabel": false,
      "readonly": false,
      "parametricDomain": {
          "min": "",
          "max": ""
      },
      "parametricDomain3Du": {
          "min": "",
          "max": ""
      },
      "parametricDomain3Dv": {
          "min": "",
          "max": ""
      },
      "polarDomain": {
          "min": "",
          "max": ""
      },
      "domain": {
          "min": "0",
          "max": "1"
      },
      "playing": false
  },
  {
      "id": "12",
      "type": "expression",
      "latex": "f_{2}\\left(x\\right)=R_{2}\\cos\\left(x\\right)-S_{2}\\cos\\left(x-b_{2}\\right)-E\\cos\\left(N_{2}x\\right)",
      "color": "#2d70b3",
      "lineStyle": "SOLID",
      "lineWidth": "",
      "lineOpacity": "",
      "pointStyle": "POINT",
      "pointSize": "",
      "pointOpacity": "",
      "fillOpacity": "",
      "hidden": true,
      "secret": false,
      "dragMode": "AUTO",
      "label": "",
      "showLabel": false,
      "labelSize": "",
      "labelOrientation": "default",
      "interactiveLabel": false,
      "readonly": false,
      "parametricDomain": {
          "min": "",
          "max": ""
      },
      "parametricDomain3Du": {
          "min": "",
          "max": ""
      },
      "parametricDomain3Dv": {
          "min": "",
          "max": ""
      },
      "polarDomain": {
          "min": "",
          "max": ""
      },
      "domain": {
          "min": "0",
          "max": "1"
      },
      "playing": false
  },
  {
      "id": "11",
      "type": "expression",
      "latex": "g_{2}\\left(x\\right)=-R_{2}\\sin\\left(x\\right)+S_{2}\\sin\\left(x-b_{2}\\right)+E\\sin\\left(N_{2}x\\right)",
      "color": "#c74440",
      "lineStyle": "SOLID",
      "lineWidth": "",
      "lineOpacity": "",
      "pointStyle": "POINT",
      "pointSize": "",
      "pointOpacity": "",
      "fillOpacity": "",
      "hidden": true,
      "secret": false,
      "dragMode": "AUTO",
      "label": "",
      "showLabel": false,
      "labelSize": "",
      "labelOrientation": "default",
      "interactiveLabel": false,
      "readonly": false,
      "parametricDomain": {
          "min": "",
          "max": ""
      },
      "parametricDomain3Du": {
          "min": "",
          "max": ""
      },
      "parametricDomain3Dv": {
          "min": "",
          "max": ""
      },
      "polarDomain": {
          "min": "",
          "max": ""
      },
      "domain": {
          "min": "0",
          "max": "1"
      },
      "playing": false
  },
  {
      "id": "10",
      "type": "expression",
      "latex": "b_{2}=-\\arctan\\left(\\frac{\\sin\\left(\\left(1-N_{2}\\right)x\\right)}{\\left(\\frac{R_{2}}{E_{2}N_{2}}\\right)-\\cos\\left(\\left(1-N_{2}\\right)x\\right)}\\right)",
      "color": "#000000",
      "lineStyle": "SOLID",
      "lineWidth": "",
      "lineOpacity": "",
      "pointStyle": "POINT",
      "pointSize": "",
      "pointOpacity": "",
      "fillOpacity": "",
      "hidden": true,
      "secret": false,
      "dragMode": "AUTO",
      "label": "",
      "showLabel": false,
      "labelSize": "",
      "labelOrientation": "default",
      "interactiveLabel": false,
      "readonly": false,
      "parametricDomain": {
          "min": "",
          "max": ""
      },
      "parametricDomain3Du": {
          "min": "",
          "max": ""
      },
      "parametricDomain3Dv": {
          "min": "",
          "max": ""
      },
      "polarDomain": {
          "min": "",
          "max": ""
      },
      "domain": {
          "min": "0",
          "max": "1"
      },
      "playing": false
  },
  {
      "id": "17",
      "type": "expression",
      "latex": "\\left(f_{2}\\left(t\\right),g_{2}\\left(t\\right)\\right)",
      "color": "#2d70b3",
      "lineStyle": "SOLID",
      "lineWidth": "",
      "lineOpacity": "",
      "pointStyle": "POINT",
      "pointSize": "",
      "pointOpacity": "",
      "fillOpacity": "",
      "hidden": true,
      "secret": false,
      "dragMode": "AUTO",
      "label": "",
      "showLabel": false,
      "labelSize": "",
      "labelOrientation": "default",
      "interactiveLabel": false,
      "readonly": false,
      "parametricDomain": {
          "min": "0",
          "max": "C"
      },
      "parametricDomain3Du": {
          "min": "",
          "max": ""
      },
      "parametricDomain3Dv": {
          "min": "",
          "max": ""
      },
      "polarDomain": {
          "min": "",
          "max": ""
      },
      "domain": {
          "min": "0",
          "max": "C"
      },
      "playing": false
  },
  {
      "id": "13",
      "type": "expression",
      "latex": "N_{2}=N-1",
      "color": "#388c46",
      "lineStyle": "SOLID",
      "lineWidth": "",
      "lineOpacity": "",
      "pointStyle": "POINT",
      "pointSize": "",
      "pointOpacity": "",
      "fillOpacity": "",
      "hidden": true,
      "secret": false,
      "dragMode": "AUTO",
      "label": "",
      "showLabel": false,
      "labelSize": "",
      "labelOrientation": "default",
      "interactiveLabel": false,
      "readonly": false,
      "parametricDomain": {
          "min": "",
          "max": ""
      },
      "parametricDomain3Du": {
          "min": "",
          "max": ""
      },
      "parametricDomain3Dv": {
          "min": "",
          "max": ""
      },
      "polarDomain": {
          "min": "",
          "max": ""
      },
      "domain": {
          "min": "0",
          "max": "1"
      },
      "playing": false
  },
  {
      "id": "14",
      "type": "expression",
      "latex": "R_{2}=R-E+l",
      "color": "#6042a6",
      "lineStyle": "SOLID",
      "lineWidth": "",
      "lineOpacity": "",
      "pointStyle": "POINT",
      "pointSize": "",
      "pointOpacity": "",
      "fillOpacity": "",
      "hidden": true,
      "secret": false,
      "dragMode": "AUTO",
      "label": "",
      "showLabel": false,
      "labelSize": "",
      "labelOrientation": "default",
      "interactiveLabel": false,
      "readonly": false,
      "parametricDomain": {
          "min": "",
          "max": ""
      },
      "parametricDomain3Du": {
          "min": "",
          "max": ""
      },
      "parametricDomain3Dv": {
          "min": "",
          "max": ""
      },
      "polarDomain": {
          "min": "",
          "max": ""
      },
      "domain": {
          "min": "0",
          "max": "1"
      },
      "playing": false
  },
  {
      "id": "16",
      "type": "expression",
      "latex": "S_{2}=S+d",
      "color": "#c74440",
      "lineStyle": "SOLID",
      "lineWidth": "",
      "lineOpacity": "",
      "pointStyle": "POINT",
      "pointSize": "",
      "pointOpacity": "",
      "fillOpacity": "",
      "hidden": true,
      "secret": false,
      "dragMode": "AUTO",
      "label": "",
      "showLabel": false,
      "labelSize": "",
      "labelOrientation": "default",
      "interactiveLabel": false,
      "readonly": false,
      "parametricDomain": {
          "min": "",
          "max": ""
      },
      "parametricDomain3Du": {
          "min": "",
          "max": ""
      },
      "parametricDomain3Dv": {
          "min": "",
          "max": ""
      },
      "polarDomain": {
          "min": "",
          "max": ""
      },
      "domain": {
          "min": "0",
          "max": "1"
      },
      "playing": false
  },
  {
      "id": "15",
      "type": "expression",
      "latex": "E_{2}=E+m",
      "color": "#000000",
      "lineStyle": "SOLID",
      "lineWidth": "",
      "lineOpacity": "",
      "pointStyle": "POINT",
      "pointSize": "",
      "pointOpacity": "",
      "fillOpacity": "",
      "hidden": true,
      "secret": false,
      "dragMode": "AUTO",
      "label": "",
      "showLabel": false,
      "labelSize": "",
      "labelOrientation": "default",
      "interactiveLabel": false,
      "readonly": false,
      "parametricDomain": {
          "min": "",
          "max": ""
      },
      "parametricDomain3Du": {
          "min": "",
          "max": ""
      },
      "parametricDomain3Dv": {
          "min": "",
          "max": ""
      },
      "polarDomain": {
          "min": "",
          "max": ""
      },
      "domain": {
          "min": "0",
          "max": "1"
      },
      "playing": false
  },
  {
      "id": "23",
      "type": "expression",
      "latex": "M=1.06",
      "color": "#388c46",
      "lineStyle": "SOLID",
      "lineWidth": "",
      "lineOpacity": "",
      "pointStyle": "POINT",
      "pointSize": "",
      "pointOpacity": "",
      "fillOpacity": "",
      "hidden": true,
      "secret": false,
      "dragMode": "AUTO",
      "label": "",
      "showLabel": false,
      "labelSize": "",
      "labelOrientation": "default",
      "interactiveLabel": false,
      "readonly": false,
      "parametricDomain": {
          "min": "",
          "max": ""
      },
      "parametricDomain3Du": {
          "min": "",
          "max": ""
      },
      "parametricDomain3Dv": {
          "min": "",
          "max": ""
      },
      "polarDomain": {
          "min": "",
          "max": ""
      },
      "domain": {
          "min": "0",
          "max": "1"
      },
      "sliderBounds": {
          "min": "-4\\pi",
          "max": "4\\pi"
      },
      "slider": {
        "hardMin": true,
        "hardMax": true,
        "loopMode": "LOOP_FORWARD",
        "isPlaying": true,
        "animationPeriod": 4000,
        "min": "-2\\pi",
        "max": "2\\pi"
      }
  },
  {
      "id": "21",
      "type": "expression",
      "latex": "X\\left(x\\right)=f_{2}\\left(x\\right)\\cos\\left(M\\right)-g_{2}\\left(x\\right)\\sin\\left(M\\right)",
      "color": "#c74440",
      "lineStyle": "SOLID",
      "lineWidth": "",
      "lineOpacity": "",
      "pointStyle": "POINT",
      "pointSize": "",
      "pointOpacity": "",
      "fillOpacity": "",
      "hidden": true,
      "secret": false,
      "dragMode": "AUTO",
      "label": "",
      "showLabel": false,
      "labelSize": "",
      "labelOrientation": "default",
      "interactiveLabel": false,
      "readonly": false,
      "parametricDomain": {
          "min": "",
          "max": ""
      },
      "parametricDomain3Du": {
          "min": "",
          "max": ""
      },
      "parametricDomain3Dv": {
          "min": "",
          "max": ""
      },
      "polarDomain": {
          "min": "",
          "max": ""
      },
      "domain": {
          "min": "0",
          "max": "1"
      },
      "playing": false
  },
  {
      "id": "22",
      "type": "expression",
      "latex": "Y\\left(x\\right)=f_{2}\\left(x\\right)\\sin\\left(M\\right)+g_{2}\\left(x\\right)\\cos\\left(M\\right)",
      "color": "#2d70b3",
      "lineStyle": "SOLID",
      "lineWidth": "",
      "lineOpacity": "",
      "pointStyle": "POINT",
      "pointSize": "",
      "pointOpacity": "",
      "fillOpacity": "",
      "hidden": true,
      "secret": false,
      "dragMode": "AUTO",
      "label": "",
      "showLabel": false,
      "labelSize": "",
      "labelOrientation": "default",
      "interactiveLabel": false,
      "readonly": false,
      "parametricDomain": {
          "min": "",
          "max": ""
      },
      "parametricDomain3Du": {
          "min": "",
          "max": ""
      },
      "parametricDomain3Dv": {
          "min": "",
          "max": ""
      },
      "polarDomain": {
          "min": "",
          "max": ""
      },
      "domain": {
          "min": "0",
          "max": "1"
      },
      "playing": false
  },
  {
      "id": "24",
      "type": "expression",
      "latex": "\\left(X\\left(t\\right)+\\left(\\left(E\\right)\\cos2M\\right),Y\\left(t\\right)-\\left(\\left(E\\right)\\sin2M\\right)\\right)",
      "color": "#624a31",
      "lineStyle": "SOLID",
      "lineWidth": "",
      "lineOpacity": "",
      "pointStyle": "POINT",
      "pointSize": "",
      "pointOpacity": "",
      "fillOpacity": "",
      "hidden": false,
      "secret": false,
      "dragMode": "AUTO",
      "label": "",
      "showLabel": false,
      "labelSize": "",
      "labelOrientation": "default",
      "interactiveLabel": false,
      "readonly": false,
      "parametricDomain": {
          "min": "",
          "max": "2\\pi"
      },
      "parametricDomain3Du": {
          "min": "",
          "max": ""
      },
      "parametricDomain3Dv": {
          "min": "",
          "max": ""
      },
      "polarDomain": {
          "min": "",
          "max": ""
      },
      "domain": {
          "min": "0",
          "max": "2\\pi"
      },
      "playing": false
  },
  {
      "id": "25",
      "type": "expression",
      "latex": "d=0.42",
      "color": "#c74440",
      "lineStyle": "SOLID",
      "lineWidth": "",
      "lineOpacity": "",
      "pointStyle": "POINT",
      "pointSize": "",
      "pointOpacity": "",
      "fillOpacity": "",
      "hidden": false,
      "secret": false,
      "dragMode": "AUTO",
      "label": "",
      "showLabel": false,
      "labelSize": "",
      "labelOrientation": "default",
      "interactiveLabel": false,
      "readonly": false,
      "parametricDomain": {
          "min": "",
          "max": ""
      },
      "parametricDomain3Du": {
          "min": "",
          "max": ""
      },
      "parametricDomain3Dv": {
          "min": "",
          "max": ""
      },
      "polarDomain": {
          "min": "",
          "max": ""
      },
      "domain": {
          "min": "0",
          "max": "1"
      },
      "sliderBounds": {
          "min": "-.5",
          "max": ".5"
      },
      "playing": false
  },
  {
      "id": "26",
      "type": "expression",
      "latex": "m=0.05",
      "color": "#2d70b3",
      "lineStyle": "SOLID",
      "lineWidth": "",
      "lineOpacity": "",
      "pointStyle": "POINT",
      "pointSize": "",
      "pointOpacity": "",
      "fillOpacity": "",
      "hidden": false,
      "secret": false,
      "dragMode": "AUTO",
      "label": "",
      "showLabel": false,
      "labelSize": "",
      "labelOrientation": "default",
      "interactiveLabel": false,
      "readonly": false,
      "parametricDomain": {
          "min": "",
          "max": ""
      },
      "parametricDomain3Du": {
          "min": "",
          "max": ""
      },
      "parametricDomain3Dv": {
          "min": "",
          "max": ""
      },
      "polarDomain": {
          "min": "",
          "max": ""
      },
      "domain": {
          "min": "0",
          "max": "1"
      },
      "sliderBounds": {
          "min": "-.5",
          "max": ".5"
      },
      "playing": false
  },
  {
      "id": "27",
      "type": "expression",
      "latex": "l=0.19",
      "color": "#388c46",
      "lineStyle": "SOLID",
      "lineWidth": "",
      "lineOpacity": "",
      "pointStyle": "POINT",
      "pointSize": "",
      "pointOpacity": "",
      "fillOpacity": "",
      "hidden": false,
      "secret": false,
      "dragMode": "AUTO",
      "label": "",
      "showLabel": false,
      "labelSize": "",
      "labelOrientation": "default",
      "interactiveLabel": false,
      "readonly": false,
      "parametricDomain": {
          "min": "",
          "max": ""
      },
      "parametricDomain3Du": {
          "min": "",
          "max": ""
      },
      "parametricDomain3Dv": {
          "min": "",
          "max": ""
      },
      "polarDomain": {
          "min": "",
          "max": ""
      },
      "domain": {
          "min": "0",
          "max": "1"
      },
      "sliderBounds": {
          "min": "-.5",
          "max": "0.5"
      },
      "playing": false
  },
  {
      "id": "28",
      "type": "expression",
      "latex": "",
      "color": "#6042a6",
      "lineStyle": "SOLID",
      "lineWidth": "",
      "lineOpacity": "",
      "pointStyle": "POINT",
      "pointSize": "",
      "pointOpacity": "",
      "fillOpacity": "",
      "hidden": false,
      "secret": false,
      "dragMode": "AUTO",
      "label": "",
      "showLabel": false,
      "labelSize": "",
      "labelOrientation": "default",
      "interactiveLabel": false,
      "readonly": false,
      "parametricDomain": {
          "min": "",
          "max": ""
      },
      "parametricDomain3Du": {
          "min": "",
          "max": ""
      },
      "parametricDomain3Dv": {
          "min": "",
          "max": ""
      },
      "polarDomain": {
          "min": "",
          "max": ""
      },
      "domain": {
          "min": "0",
          "max": "1"
      },
      "playing": false
  }
]
}
};


var currentState = {
"version": 9,
"graph": {
  "viewport": {
  "xmin": -10,
  "ymin": -10,
  "xmax": 10,
  "ymax": 10
},
"showGrid": false
},
"expressions": {
 "list": [
  {
    "type": "expression",
    "id": "1",
    "color": "#c74440"
  }
 ]
}
}


calculator.setState(liqPistonState);

function format(s) {
let newExpression = s;
newExpression.replace("\left", "");
console.log(newExpression);
}

function iterativeReplace(s,remove,add) {
while (s.includes(remove)) {
  s = s.replace(remove,add);
}
return s;
}

function format(n,r,s,e) {
let xParam =  "(R*cos(t))-(Rr*cos(t+atan(sin((1-N)*t)/((R/(E*N))-cos((1-N)*t)))))-(E*cos(N*t))";
let yParam = "(-R*sin(t))+(Rr*sin(t+atan(sin((1-N)*t)/((R/(E*N))-cos((1-N)*t)))))+(E*sin(N*t))";

xParam = iterativeReplace(xParam,"Rr",s);
xParam = iterativeReplace(xParam,"N",n);
xParam = iterativeReplace(xParam,"E",e);
xParam = iterativeReplace(xParam,"R",r);
                    
yParam = iterativeReplace(yParam,"Rr",s);
yParam = iterativeReplace(yParam,"N",n);
yParam = iterativeReplace(yParam,"E",e);
yParam = iterativeReplace(yParam,"R",r);
                    
console.log("x(t): " + xParam + "         y(t) + " + yParam);
}



// function output() {
//   calculator.updateSettings({
//     expressions: false,
//     showGrid: false
//   });
// }

// var currentData = document.getElementById("button");
// currentData.addEventListener("click", output, true);

