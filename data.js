export const services = [
  {id:'bumper',name:'Покраска бампера',price:13000,max:10},
  {id:'door',name:'Покраска двери',price:13000,max:10},
  {id:'fender',name:'Покраска крыла',price:13000,max:10},
  {id:'hood',name:'Покраска капота',price:15000,max:10},
  {id:'sill',name:'Покраска порога',price:10000,max:10},
  {id:'restoration',name:'Восстановление порога',price:6000,max:10},
  {id:'roof',name:'Покраска крыши',price:20000,max:10}
];

// Connect the approved server endpoint and analytics counter before production lead collection.
export const integration = { endpoint:'', metricaId:null };

// Only verified customer reviews belong in this collection.
export const reviews = [];
