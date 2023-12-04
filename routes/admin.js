var express = require('express');
const { response } = require('../app');
const adminHelpers = require('../helpers/admin-helpers');
//const { render } =require('../app');
const productHelpers = require('../helpers/product-helpers');
var router = express.Router();
var productHelper=require('../helpers/product-helpers');
const userHelpers = require('../helpers/user-helpers');
/* GET users listing. */

const preadmin="anwar"
const prepass="1234"

router.get('/', function(req, res, next) {

  // res.header('Cache-Control', 'no-cache, private, no-store, must-revalidate, max-stale=0, post-check=0, pre-check=0');
  let User=req.session.admin;
  if(User){
    res.redirect('/admin/admin-index')
  }
  else
 res.render('admin/admin-login',{layout:'admin-layout',loginerr:req.session.loginerr});
 req.session.loginerr=null

 
})

router.post('/admin-index',(req,res)=>{

  const userdata={username,password}=req.body;
  if(preadmin==username && prepass==password){
    req.session.loggedIn=true;
    req.session.admin=userdata;
    res.redirect('admin-index')
  }
  else{
    req.session.loginerr="invalid Username or Password"
    res.redirect('/admin')
  }
  
})



router.get('/admin-index', async(req, res, next)=> {
  let data= await adminHelpers.doNutchartData()
  let year = await adminHelpers.yearlyChart()
   let month = await adminHelpers.salesMonthlyGraph()
   let daily = await adminHelpers.salesGraph()
//   for(var i=0;i<7;i++){
      
//   }
   let dailysales = await adminHelpers.getDailySales()
   let dailyorders = await adminHelpers.getDailyOrders()
   let TotalUsers = await adminHelpers.getTotalUsers()
   let TotalInactiveUsers = await adminHelpers.getTotalInactiveUsers()
   let status = await adminHelpers.piechartData()
  let payment = await adminHelpers.barchartData()
   let sum=0
   for(var i=0;i<dailysales.length;i++){
   sum=sum+dailysales[i].totalAmount
  }
 console.log(sum,"mmmmmmmmmmmmmmmmm");
  let sumFinal= Math.round(sum)
  console.log(sumFinal,"heydsssssssssss");
  // res.render('admin/Admin-dashboard',{data,year,dailysales,sumFinal,dailyorders,
  //     TotalUsers,TotalInactiveUsers,status,payment,month,daily})
    res.render('admin/admin-index',{layout:'admin-layout',admin:true,year,data,month,daily,sumFinal,status,payment,TotalUsers,TotalInactiveUsers,dailyorders,dailysales});
  })
  


router.get('/add-product', function(req, res, next) {
  adminHelpers.getAllcategory().then((category)=>{
    console.log(category,'bhgffgg');
    res.render('admin/add-product',{layout:'admin-layout',admin:true,category});

  })
});

router.post('/add-product',(req,res)=>{
  console.log(req.body.Price);
  req.body.Price=parseInt(req.body.Price)
   req.body.OfferPrice=parseInt(req.body.OfferPrice)
   req.body.stock=parseInt(req.body.stock)
  console.log(req.body.Price);
  console.log(req.body.OfferPrice);
  console.log(req.files.image);
  console.log(req.files.image1);

productHelpers.addProduct(req.body,(id)=>{
    let image=req.files.image
    let image1=req.files.image1
    let image2=req.files.image2
    let image3=req.files.image3
    console.log(id);
    image.mv('./public/product-images/'+id+'.jpg',(err,done)=>{
      image1.mv('./public/product-img1/'+id+'.jpg',(err,done)=>{
        image2.mv('./public/product-img2/'+id+'.jpg',(err,done)=>{
          image3.mv('./public/product-img3/'+id+'.jpg',(err,done)=>{
            
      if(!err){
        res.redirect('/admin/add-product')
      }else{
        console.log(error);
      }
    })
  })
})
})
   
  })
  
})

router.get('/product-view', function(req, res, next) {
  productHelpers.getAllproducts().then((products)=>{
    console.log(products,'bhgffgg');
    res.render('admin/view-products',{layout:'admin-layout',admin:true,products});
  })
});

router.get('/user-detail', async function(req, res, next) {
 let user=await adminHelpers.getAllusers()
    console.log(user,'bhgffgg');
    res.render('admin/user-detail',{layout:'admin-layout',admin:true,user});
  })

  router.get('/users-edit',async(req,res)=>{
    let users=await adminHelpers.getUsersDetails(req.query.id)
    console.log(users)
    res.render('admin/users-edit',{layout:'admin-layout',admin:true,users})
  })
  
  router.post('/users-edit/:id',(req,res)=>{
    console.log(req.params.id);
    let id=req.params.id
    adminHelpers.updateUsers(req.params.id,req.body).then(()=>{
      res.redirect('/admin/users')
      
    })
  })

router.get('/delete-product/:id',(req,res)=>{
   let proId=req.params.id
   console.log(proId);
   productHelpers.deleteProduct(proId).then((response)=>{
    res.redirect('/admin/product-view')
   })
})

router.get('/delete-user/:id',(req,res)=>{
  let userId=req.params.id
  console.log(userId);
  adminHelpers.deleteProduct(userId).then((response)=>{
   res.redirect('/admin/user-detail')
  })
})




router.get('/edit-product',async(req,res)=>{
 
  let product=await productHelpers.getProductDetails(req.query.id)
  adminHelpers.getAllcategory().then((category)=>{
    console.log(category,'bhgffgg');
  console.log(product)
  res.render('admin/edit-product',{layout:'admin-layout',admin:true,product,category})
})
})

router.post('/edit-product/:id',(req,res)=>{
  console.log(req.params.id);
  let id=req.params.id
  productHelpers.updateProduct(req.params.id,req.body).then(()=>{
    res.redirect('/admin/product-view')
    if(req.files?.image && req.files?.image1 && req.files?.image2 && req.files?.image3 ){
      
      let image=req.files.image
      let image1=req.files.image1
      let image2=req.files.image2
      let image3=req.files.image3
      image.mv('./public/product-images/'+id+'.jpg')
      image1.mv('./public/product-img1/'+id+'.jpg')
      image2.mv('./public/product-img2/'+id+'.jpg')
      image3.mv('./public/product-img3/'+id+'.jpg')
   
    }
  })
})
  
router.get('/block/:id',(req, res, next)=> {
  let userId= req.params.id
  adminHelpers.blockuser(userId)
  console.log('blkd');
  res.redirect('/admin/user-detail');
})

router.get('/unblock/:id',(req, res, next)=> {
  let userId= req.params.id
  console.log('unblkcd');
  adminHelpers.unblockuser(userId)
  console.log('unblkcd');
  res.redirect('/admin/user-detail');
})



router.get('/category-add', function(req, res, next) {
  let msg = req.session.msg
  res.render('admin/category-add',{msg,layout:'admin-layout',admin:true});
})

router.post('/category-add',(req,res)=>{
  adminHelpers.addCategory(req.body).then((permissionf) => {
    console.log(permissionf);
    if (permissionf.permission) {
      console.log("permission granted for category insertion"); //checkpoint1
      req.session.msg = "Category Added Succesfully"
      res.redirect("/admin/category-add");
    } else {
      console.log("Category already exists");
      req.session.msg = "Category Already Exists" //checkpoint2
      res.redirect("/admin/category-add");
    }
  });

  
})



router.get('/category', function(req, res, next) {
  adminHelpers.getAllcategory().then((category)=>{
    console.log(category,'bhgffgg');
    res.render('admin/category',{layout:'admin-layout',admin:true,category});
  })
});

router.get('/category-edit',async(req,res)=>{
 
  let category=await adminHelpers.getCategoryDetails(req.query.id)
  console.log(category)
  res.render('admin/category-edit',{layout:'admin-layout',admin:true,category})
})

router.post('/category-edit/:id',(req,res)=>{
  console.log(req.params.id);
  let id=req.params.id
  adminHelpers.updateCategory(req.params.id,req.body).then(()=>{
    res.redirect('/admin/category')
    
  })
})
 

router.get('/delete-category/:id',(req,res)=>{
  let catId=req.params.id
  console.log(catId);
  adminHelpers.deleteCategory(catId).then((response)=>{
   res.redirect('/admin/category')
  })
})

// router.get('/orders',async(req,res)=>{
//   let orders=await adminHelpers.getUserOrders()
//   console.log(orders,'/./././/./???>/./.');
//   res.render('admin/orders',{layout:'admin-layout',admin:true,orders})
// })

router.get('/delete-orders/:id',(req,res)=>{
  let orderId=req.params.id
  console.log(orderId,'kkkkkkkkkkkkkkkkkkk');
  adminHelpers.deleteOrder(orderId).then((response)=>{
   res.redirect('/admin/orders')
  })
})

// router.get('/delete-order',(req,res)=>{
//   let orderId=req.query.id
//   console.log(orderId);
//   userHelpers.deleteOrder(orderId).then((response)=>{
//    res.redirect('/orders')
//   })
// })


router.get('/orders',async(req,res)=>{
  let orders=await adminHelpers.getUserOrders()
  console.log(orders,'/./././/./???>/./.');
  res.render('admin/orders',{layout:'admin-layout',admin:true,orders})
})

router.post('/order-canceladmins',(req,res)=>{
  let status=req.body.status;
  let orderId=req.body.orderId;
  
  adminHelpers.setDeliveryStatus(status,orderId).then((response)=>{
    if(response){
       res.json({status:true})
    }
    else{
       res.json({status:false})
    }
 })
//   adminHelpers.cancelOrder(req.params.id).then((response)=>{

//     res.json(response)
// })
})

// router.get('/order-shipped/:id',(req,res)=>{
//   console.log("1234");
//   adminHelpers.shippedOrder(req.params.id).then((response)=>{

//     res.json(response)
// })
// })

// router.get('/order-delivered/:id',(req,res)=>{
//   console.log("es");
//   adminHelpers. deliveredOrder(req.params.id).then((response)=>{

//     res.json(response)
// })
// })

router.get('/sales',(req,res)=>{
  res.render('admin/sales',{layout:'admin-layout',admin:true})
})


router.post('/sales',async(req,res)=>{
  day= req.body.day
  dayend=req.body.dayend
  console.log(req.body,'e4rf');   
let dailysalePro = await adminHelpers.getDailySalespro(day,dayend)    
console.log(dailysalePro,"dailysalePro");
//let dailyReport = await adminHelpers.getDailyReport()
let sum=0;
for(var i=0;i<dailysalePro.length;i++){
    sum=sum+dailysalePro[i].quantity
}

let sum2=0;
for(var i=0;i<dailysalePro.length;i++){
    sum2=sum2+dailysalePro[i].totalAmount
}

let dailysale = await adminHelpers.getDailySales(day)

 res.render('admin/sales',{layout:'admin-layout',admin:true,dailysale:true,dailysalePro,sum,sum2,dailysale})
})


router.get('/dailysales',(req,res)=>{
  res.render('admin/dailySales')
})

router.get('/yearlysales',(req,res)=>{
  res.render('admin/dailySales')
})

router.post('/dailysales',async(req,res)=>{
 let day= req.body.day
 let dayend=req.body.dayend
  console.log(req.body,'e4rf');   
let dailysalePro = await adminHelpers.getDailySalespro(day,dayend)    
console.log(dailysalePro,"dailysalePro");
//let dailyReport = await adminHelpers.getDailyReport()
let sum=0;
for(var i=0;i<dailysalePro.length;i++){
    sum=sum+dailysalePro[i].quantity
}

let sum2=0;
for(var i=0;i<dailysalePro.length;i++){
    sum2=sum2+dailysalePro[i].totalAmount
}

let dailysale = await adminHelpers.getDailySales(day)

 res.render('admin/dailySales',{layout:'admin-layout',admin:true,dailysale:true,dailysalePro,sum,sum2,dailysale})
})



router.post('/monthlysales',async(req,res)=>{
  let day=req.body.year+"-"+req.body.month
  console.log(day);
  let monthly = await adminHelpers.getMonthlySalesPro(day)

  let sum=0
  for(var i=0;i<monthly.length;i++){
    sum=sum+monthly[i].count
  }
  
  let sum2=0
  for(var i=0;i<monthly.length;i++){
    sum2=sum2+monthly[i].totalAmount
  }
 
  console.log("sjdkkdj");
  console.log(monthly);

  res.render('admin/dailySales',{layout:'admin-layout',admin:true,monthlysales:true,sum,sum2,monthly})
})

router.post('/yearlysales',async(req,res)=>{
  let day=req.body.year
  console.log(day);
  let yearlyy = await adminHelpers.getYearlySalesPro(day)

  let sum=0
  for(var i=0;i<yearlyy.length;i++){
    sum=sum+yearlyy[i].count
  }
  
  let sum2=0
  for(var i=0;i<yearlyy.length;i++){
    sum2=sum2+yearlyy[i].totalAmount
  }
 
  console.log("sjdkkdj");
  console.log(yearlyy);

  res.render('admin/dailySales',{layout:'admin-layout',admin:true,yearlysales:true,sum,sum2,yearlyy})
})


router.get('/addcoupen',(req,res)=>{
  res.render('admin/addCoupens',{layout:'admin-layout',admin:true})
})

router.post('/addcoupen',(req,res)=>{
  adminHelpers.addCoupon(req.body).then((response) => {
    if (response.status) {
        res.redirect('/admin/addcoupen')
        
    } else {
        // res.send('product added')
        res.redirect('/admin/viewcoupen')


    }

})

})

router.get('/viewcoupen',(req,res)=>{
  adminHelpers.viewCoupens().then((coupen) => {
    // console.log(product)
    res.render('admin/ViewCoupons',{coupen,layout:'admin-layout',admin:true})
})

})




router.get('/banner',(req,res)=>{

  res.render('admin/banner',{admin:true,layout:'admin-layout'})
})

router.post('/banner',(req,res)=>{
  console.log(req.body);

  console.log(req.files.image);
 

adminHelpers.addBanner(req.body,(id)=>{
    let image=req.files.image
   
    console.log(id);
    image.mv('./public/banner-img/'+id+'.jpg',(err,done)=>{
     
            
      if(!err){
        res.redirect('/admin/view-banner')
      }else{
        console.log(error);
      }
    })
  })
})


router.get('/view-banner', function(req, res, next) {
  adminHelpers.getAllbanner().then((banner)=>{
    console.log(banner,'bhgffgg');
    res.render('admin/view-banner',{layout:'admin-layout',admin:true,banner});
  })
});


router.get('/edit-banner',async(req,res)=>{
 
  let banner=await adminHelpers.getBannerDetails(req.query.id)
 
 
  res.render('admin/edit-banner',{layout:'admin-layout',admin:true,banner})

})

router.post('/edit-banner/:id',(req,res)=>{
  console.log(req.params.id);
  let id=req.params.id
  adminHelpers.updateBanner(req.params.id,req.body).then(()=>{
    res.redirect('/admin/view-banner')
    if(req.files?.image){
      
      let image=req.files.image
   
      image.mv('./public/banner-img/'+id+'.jpg')
   
   
    }
  })
})


router.get('/delete-banner/:id',(req,res)=>{
  let BanId=req.params.id
  console.log(BanId);
  adminHelpers.deleteProduct(BanId).then((response)=>{
   res.redirect('/admin/view-banner')
  })
})


router.getzzzzzzzzzzzzzzzzzzzz

module.exports = router;

