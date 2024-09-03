<template>
  <div ref="mapContainer" class="h-full"></div>
   <!-- 添加地图点位的表单 -->
   <div v-if="showAddPointForm" class="add-point-form">
      <div>
        <label for="point-name">名称：</label>
        <input type="text" id="point-name" v-model="newPoint.properties.名称">
      </div>
      <div>
        <label for="point-short-name">简称：</label>
        <input type="text" id="point-short-name" v-model="newPoint.properties.简称">
      </div>
      <div>
        <label for="point-rating">评分：</label>
        <input type="text" id="point-rating" v-model="newPoint.properties.评分">
      </div>
      <div>
        <label for="point-review">评论：</label>
        <input type="text" id="point-review" v-model="newPoint.properties.评论">
      </div>
      <div>
        <label for="point-average-cost">人均：</label>
        <input type="text" id="point-average-cost" v-model="newPoint.properties.人均">
      </div>
      <button @click="addPoint">添加点位</button>
      <button @click="showAddPointForm = false">取消</button>
    </div>
 
</template>

<script setup>
import { ref, onMounted } from 'vue';
import mapboxgl from 'mapbox-gl';
import { emitter } from '@/utils/event';
import { geo, setLoc, setCurrent } from '@/utils/store';
import { Color } from '@/utils/constants';

const mapContainer = ref(null);
let map = null;

onMounted(() => {
  mapboxgl.accessToken = 'pk.eyJ1IjoiYmVsMjV6aHUiLCJhIjoiY2x2eTNyZTJ5MDdsYzJyczF3NWU1d3k3dCJ9.3mLRnW951ifyU_GubGlY-A';
  map = new mapboxgl.Map({
    container: mapContainer.value,
    // style: "mapbox://styles/bel25zhu/clvy5izp701tn01rjf9dy7y6r",
    //mapbox://styles/bel25zhu/clvy4ii68016a01rdf5ah1koh
    style: 'mapbox://styles/bel25zhu/clvy4ii68016a01rdf5ah1koh',
    center: [104.063132, 30.580685],
    zoom: 9,
  });

  map.on('load', () => {
    map.addImage('#50C240', createColorPoint(80, 194, 64, 255)); // 绿色
    map.addImage('#F3AE1A', createColorPoint(255, 193, 7, 255)); // 橙色
    map.addImage('#C24740', createColorPoint(194, 71, 64, 255)); // 红色
    map.addImage('#BEBEBE', createColorPoint(125, 125, 125, 255)); // 灰色

    updateMap();
  });

  map.on('mouseenter', 'layer', () => {
    map.getCanvas().style.cursor = 'pointer';
  });

  map.on('mouseleave', 'layer', () => {
    map.getCanvas().style.cursor = '';
  });

  map.on('click', 'layer', (e) => {
    if (!e.features) return;

    const coordinates = e.features[0].geometry.coordinates.slice();
    const properties = e.features[0].properties;

    setCurrent({ coordinates, properties });
  });

  map.on('click', 'clusters', (e) => {
    const features = map.queryRenderedFeatures(e.point, {
      layers: ['clusters'],
    });

    if (!features.length) return;

    const clusterId = features[0].properties.cluster_id;
    map.getSource('source').getClusterExpansionZoom(clusterId, (err, zoom) => {
      if (err) return;

      map.easeTo({
        center: features[0].geometry.coordinates,
        zoom,
      });
    });
  });

  // 获取当前位置
  const geoControl = new mapboxgl.GeolocateControl({
    positionOptions: {
      enableHighAccuracy: true,
    },
    trackUserLocation: true,
  });

  map.addControl(geoControl);

  emitter.on('location', (e) => {
    geoControl.trigger();
  });

  emitter.on('fly-to', (data) => {
    map.flyTo(data);
  });

  geoControl.on('geolocate', (e) => {
    setLoc([e.coords.longitude, e.coords.latitude]);
  });

  // 添加点击事件监听器，在地图上打点
  map.on('dblclick', (e) => {
    const { lng, lat } = e.lngLat;
    // 调用 addPointDialog 函数处理双击事件
    addPointDialog([lng, lat]);
  });
});

// 创建颜色点
function createColorPoint(...color) {
  const d = 48;
  const r = d / 2;
  const r2 = r ** 2;
  const bytesPerPixel = 4;

  const data = new Uint8Array(d * d * bytesPerPixel);

  for (let x = 0; x < d; x++) {
    for (let y = 0; y < d; y++) {
      if ((x - r) ** 2 + (y - r) ** 2 >= r2) continue;

      const offset = (y * d + x) * bytesPerPixel;
      for (let b = 0; b < bytesPerPixel; b++) data[offset + b] = color[b];
    }
  }
  return { width: d, height: d, data };
}

// 渲染点位
function updateMap() {
  map.addSource('source', {
    type: 'geojson',
    data: geo,
    cluster: true,
    clusterMaxZoom: 12,
    clusterRadius: 25,
  });

  map.addLayer({
    id: 'clusters',
    type: 'circle',
    source: 'source',
    filter: ['has', 'point_count'],
    paint: {
      'circle-color': '#d3cdc0',
      'circle-stroke-color': '#a59a83',
      'circle-stroke-width': 1,
      'circle-radius': 10,
    },
  });

  map.addLayer({
    id: 'clusters-count',
    type: 'symbol',
    source: 'source',
    filter: ['has', 'point_count'],
    layout: {
      'text-field': ['get', 'point_count_abbreviated'],
      'text-size': 12,
      'text-allow-overlap': true,
    },
    paint: {
      'text-color': 'white',
    },
  });

  map.addLayer({
    id: 'layer',
    type: 'symbol',
    source: 'source',
    layout: {
      'icon-image': ['match', ['get', '评分']].concat(Object.entries(Color).flat(), 'black'),
      'icon-size': 0.25,
      'text-field': ['get', '简称'],
      'text-size': 12,
      'text-offset': [0, 0.5],
      'text-anchor': 'top',
      'icon-allow-overlap': true,
    },
    paint: {
      'text-color': '#7e6c56',
      'text-halo-color': '#fff',
      'text-halo-width': 1,
      'text-halo-blur': 0,
    },
  });
}// 添加新的地图点位，并保存数据到现有的 JSON 文件
function addPointDialog(coordinates) {
  const confirmAddPoint = confirm("是否要在此处添加新的地图点位？");
  if (confirmAddPoint) {
    const name = prompt("请输入名称：");
    if (!name) return; // 如果名称为空，则不添加点位

    // 弹出对话框让用户填写属性信息
    const properties = {};
    properties.名称 = name;
    properties.简称 = prompt("请输入简称：") || '';
    properties.评分 = prompt("请输入评分：") || '';
    properties.评论 = prompt("请输入评论：") || '';
    properties.人均 = prompt("请输入人均：") || '';

    // 构建地图点位对象
    const newPoint = {
      type: 'Feature',
      properties: properties,
      geometry: {
        type: 'Point',
        coordinates: coordinates
      }
    };

    // 将数据保存到 JSON 文件中
    saveDataToFile(newPoint);
  }
}

// 保存数据到 JSON 文件中
function saveDataToFile(newPoint) {
  // 从现有文件中获取JSON数据
  const jsonData = {
    "quanzhou": {
      "name": "泉州",
      "count": 5,
      "data": {
        "type": "FeatureCollection",
        "features": [
          newPoint
        ]
      },
      "center": [118.657169,24.870175]
    }
  };

  // 将 JSON 数据转换为字符串
  const jsonString = JSON.stringify(jsonData, null, 2);

  // 使用浏览器的文件保存功能，将数据保存到 JSON 文件中
  const blob = new Blob([jsonString], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'data_food.json';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

</script>

<style scoped>
#map {
  width: 100%;
  height: 100%;
}
</style>
