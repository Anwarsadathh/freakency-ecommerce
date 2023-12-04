var express = require('express');
const { response } = require('../app');
const adminHelpers = require('../helpers/admin-helpers');
var router = express.Router();
const productHelpers = require('../helpers/product-helpers');
const userHelpers=require('../helpers/user-helpers')
var paypal = require('paypal-rest-sdk');

paypal.configure({
  'mode': 'sandbox', //sandbox or live 
  'client_id': 'ASJQbkHDj9yHejQNs91vN_BgdVrfOybAguX4Dq3fIYUgtXCYjXD0AFDlaKWAcX3hPKODq8BxuGGPdyzJ', // please provide your client id here 
  'client_secret': 'EEaV_xSFNxKM__N8cnHDjdU8kZye-RUyRABjxDHB9qhzH6bmZzUSZ4fHy55EaMM4x7wAXIVWrNCyB4Ey' // provide your client secret here 
});


const verifyLogin=(req,res,next)=>{
  if(req.session.userloggedIn){
    next()
  }else{
    res.redirect('/login')
  }
}

/* GET home page. */
router.get('/',async function(req, res, next) {
 let user=req.session.user
  let cartCount=null
  let pro=null
  let total=null
  req.session.returnTo=req.originalUrl;
  if(req.session.user){
   pro=await userHelpers.getCartProducts(req.session.user._id)
   total =await userHelpers.getTotalAmount(req.session.user._id)
  cartCount=await userHelpers.getCartCount(req.session.user._id)
  console.log(cartCount,'cartjjjj');
  }
  // const tshirt=await productHelpers.getAllTshirt()
  let categoryView= await productHelpers.viewCategory()
  //console.log(categoryView,'heheheehheheheeheh');
  banner=await userHelpers.getAllbanner()
  productHelpers.getAllproducts().then((products)=>{
   
    res.render('user/view-products',{user:true,pro,products,banner,categoryView,user,total,cartCount});
  
})
});
 



router.get('/login', function(req, res, next) {
  if(req.session.loggedIn){
    res.redirect('/')
  }else{
  res.render('user/login',{"loginErr":req.session.userloginErr});
  req.session.userloginErr=false
  }
});


 
router.get('/signup', function (req, res, next) {
  res.render('user/signup');
});

router.post('/signup', (req, res) => {
  userHelpers
    .doSignup(req.body)
    .then((response) => {
      console.log(response);

      req.session.user = response;
      req.session.userloggedIn = true;

  
      req.flash('success', 'Signup successful! Please log in.');

 
      res.redirect('/login');
    })
    .catch((error) => {
 
      console.error(error);
      req.flash('error', error); 
      res.redirect('/signup');
    });
});


router.post('/login', (req, res) => {
  userHelpers.doLogin(req.body).then((response) => {
    if (response.status) {
      req.session.userloggedIn = true;
      req.session.user = response.user;
      res.redirect(req.session.returnTo || '/');
    } else {
      req.session.userloginErr = 'Invalid username or password';
      res.redirect('/login');
    }
  }).catch((error) => {
    if (error === 'This account is blocked. Please contact support for assistance.') {
      
      req.session.userloginErr = error;
    } else {
     
      console.error(error);
      req.flash('error', error); 
    }
    res.redirect('/login');
  });
});



router.get('/logout',(req,res)=>{
  req.session.user=null
  res.redirect('/')
})

router.get('/shop', async(req, res, next) =>{
  let user=req.session.user
  // if(req.session.user){
  //   cartCount=await userHelpers.getCartCount(req.session.user._id)
  //   console.log(cartCount,'cartjjjj');
  //   }
   //let cartCount=await userHelpers.getCartCount(req.session.user._id)
   req.session.returnTo=req.originalUrl;
    //tshirt=await productHelpers.getAllTshirt()
  productHelpers.getAllproducts().then(async(products)=>{
    let count = 0
    //counting all products one by one
    products.forEach(AllProducts => {
      count++
    });
    let pageCount = await productHelpers.paginatorCount(count)
    products = await productHelpers.getTenProducts(req.query.id)

    if (req.query.minimum) {
      let minimum = req.query.minimum.slice(1)
      let maximum = req.query.maximum.slice(1)
      let arr = []
      products = await productHelpers.getAllproducts()
     
      products.forEach(products => {
        if (products.price >= minimum && products.price <= maximum) {
          arr.push(Products)
        }
      });
      products = arr  ;
    }

    let userr=req.session.user
    let categoryView= await productHelpers.viewCategory()
  res.render('user/shop',{products,userr,user,pageCount,categoryView});
  })
});



router.get('/categoryView/',async(req,res)=>{
  let categoryView= await productHelpers.viewCategory()
    let cartCount=null
    if(req.session.user){
        cartCount=await userHelpers.getCartCount(req.session.user._id)
       }
       let user=req.session.user;
       req.session.returnTo=req.originalUrl;
       console.log("this i heteeeeeeeeeeeeeee")
       let products=await productHelpers.getCategoryWiseProducts(req.query.id)
    res.render('user/category',{user,products,cartCount,categoryView})

})

router.get('/contact', function(req, res, next) {
  res.render('user/contact');
});
  




router.get('/wishlist', function(req, res, next) {
  res.render('user/wishlist');
});


router.get('/single-product/',verifyLogin,async (req, res, next)=> {
  
  let id =req.query.singlepid
  let user=req.session.user
  req.session.returnTo=req.originalUrl;
  console.log(id,'jackkkkkk');
   let singleProduct=await  userHelpers.getSingleProduct(id)
   console.log(singleProduct,'????????????????//');
   if(req.session.user){
   cartproduct=await userHelpers.getCartProducts(req.session.user._id)
    totalAmount =await userHelpers.getTotalAmount(req.session.user._id)
   cartCount=await userHelpers.getCartCount(req.session.user._id)
   }
  res.render('user/single-product',{singleProduct,user,cartproduct, totalAmount,cartCount});
});

router.get('/cart',verifyLogin,async(req, res, next)=> {
  let products=await userHelpers.getCartProducts(req.session.user._id)
  console.log(products,"hiihh");
  //  let total=0
  // if(products.lenght>0){
  //   total =await userHelpers.getTotalAmount(Id)
  //  }
  subtotal = await productHelpers.getSubTotalAmount(req.session.user._id)
  for (var i = 0; i < products.length; i++) {
      products[i].subTotal = subtotal[i].suBtotal
  }

  if (products.length > 0) {
    totalValue = await userHelpers.getTotalAmount(req.session.user._id)

}

  let Id=req.session.user._id
 //let total =await userHelpers.getTotalAmount(Id)
  res.render('user/cart',{products,user:true,user:req.session.user,totalValue});
});


router.get('/add-to-cart/:id',(req,res)=>{
  console.log('api call');
   userHelpers.addToCart(req.params.id,req.session.user._id).then(()=>{
   res.json({status:true})
    //res.redirect('/')
   })
})


router.post('/change-product-quantity',(req,res,next)=>{
  console.log(req.body,'bodyyyyy');
  userHelpers.changeProductQuantity(req.body).then(async(response)=>{
    response.total =await userHelpers.getTotalAmount(req.body.user)
    response.subtotal = await productHelpers.getSubTotal(req.body)
    res.json(response)
  })
})


///placeorder


router.get('/checkout',verifyLogin,async (req, res, next)=> {
   let Id=req.session.user._id
   let user=req.session.user
   console.log(Id,'id >>>>>');
   let addData= await userHelpers.getUserAddress(Id)
   console.log(addData,"llllllllllllllllllllllllllllllll");
   let products=await userHelpers.getCartProducts(req.session.user._id)
  let total =await userHelpers.getTotalAmount(Id)
  res.render('user/checkout',{total,user:true,user,products,addData});
});

router.post('/checkout',async(req,res)=>{
  //console.log("checked post");
  console.log(req.body,"req bosyy");
  //console.log(req.session.user._id,"user prestn");
  let userid=req.session.user._id
  //console.log(req.body.userId,"user iddd pr`e");
  let products=await userHelpers.getCartProductList(userid)
  console.log(products,"producte posted");
  let couponVerify = await userHelpers.couponVerify(req.session.user._id)
  let totalPrice=await userHelpers.getTotalAmount(userid)
  
  userHelpers.placeOrder(req.body,products,totalPrice,userid).then((orderId)=>{
  if(req.body['selectedPayment']==='COD'){
    res.json({codSuccess:true})
  }else if(req.body['selectedPayment']==='ONLINE'){
    userHelpers.generateRazorpay(orderId,totalPrice).then((response)=>{
     response.razorPay=true
        res.json(response)
    })
 }
 else if(req.body['selectedPayment']==='PAYPAL'){
     var payment = {
         "intent": "sale",
         "payer": {
             "payment_method": "paypal"
         },
         "redirect_urls": {
             "return_url": "http://localhost:3000/order-success",
             "cancel_url": "http://localhost:3000"
         },
         "transactions": [{
             "amount": {
                 "currency": "USD",
                 "total": totalPrice
             },
             "description": orderId
         }]
     };

     userHelpers.createPay(payment).then((transaction)=>{
             var id = transaction.id;
             var links = transaction.links;
             var counter = links.length;
         while(counter--){
             if(links[counter].rel=='approval_url'){
                 transaction.pay = true
                 transaction.linkto = links[counter].href
                 transaction.orderId = orderId
                 userHelpers.changePaymentStatus(orderId).then(()=>{
                     res.json(transaction)
                 })
             }
         }
     })
 }
 
})



})




router.get('/order-success',async(req,res)=>{
  let orders=await userHelpers.getUserOrders(req.session.user._id)
  res.render('user/order-success',{user:req.session.user,orders})
})

router.get('/orders',async(req,res)=>{
  let orders=await userHelpers.getUserOrders(req.session.user._id)
  console.log(orders,'/./././/./???>/./.');
  res.render('user/orders',{user:req.session.user,orders})
})


router.get('/view-order-products/',async(req,res)=>{
  const orderID = req.query.id
 
  let cartCount = await userHelpers.getCartCount(req.session.user._id)
  userHelpers.getOrderProducts(orderID).then((orders) => {
   
    orders.forEach(element=>{
      
      if(element.status==="cancelled"){
       element.cancelled=true 
        
      }else if(element.status==="Delivered"){
          element.Delivered=true
      }else if(element.status=="Return-requested" || element.status==="Return Approved"){
        element.returnOrder=true
      }else if(element.status=="Refund Approved"){
        element.refunded = true
      }else{
       element.cancelled=false
       element.Delivered=false
       element.returnOrder=false

      }
    })
    
    res.render("user/view-order-products", { user: true, orders,cartCount});
  }).catch((error)=>{
    res.status(500).render('user/error',{ message: error.message })
  })
//  let orderID=req.query.id
//  console.log(orderID,'>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>');
//   let user=req.session.user
//   let products= await userHelpers.getOrderProducts(orderID)
  
//   res.render('user/view-order-products',{user:req.session.user,products,user})
})


router.post('/cancelorder',(req,res)=>{
  console.log(req.body)
  userHelpers.updateOrderStatus(req.body).then((response)=>{
  
      userHelpers.stockIncrement(req.body).then((done)=>{
        res.json({done:true})
      }).catch((error)=>{
        res.status(500).render('user/error',{ message: error.message })

      })
      
    })
})

router.get('/order-cancel/:id',async(req,res)=>{
  let user = req.session.user

  console.log(req.body,"iooioioio");

  let description = "Order Cancelled"

  await userHelpers.cancelOrder(req.params.id,user).then(async(response) => {

      console.log(response,"lklklklk");

      let order = {

          orderId : response.order._id,
          amount : response.order.totalAmount
      }
      await userHelpers.setWalletHistory(user,order,description)

      res.json(response)
  })
})

   
router.post('/verify-payment',(req,res)=>{
  console.log(req.body);  
  userHelpers.verifyPayment(req.body).then(()=>{
    userHelpers.changePaymentStatus(req.body['order[receipt]']).then(()=>{
      console.log("Payment successfull")
      res.json({status:true})
    })
  })
  .catch((err)=>{
    console.log(err);
    res.json({status:false,errMsg:''})
  })
})



router.post('/Add-adress', (req, res) => {
  userId = req.session.user._id
  adressData = req.body
  req.session.message = 'Adress successfully added'
  userHelpers.AddAdress(userId, adressData)
  res.redirect('/Add-adress')
})



router.post('/ADD-AD', (req, res) => {
//userId = req.session.user._id
console.log(req.body,"ppppppppppppppp");
let Id=req.session.user._id
console.log(Id,"sdsdsdsdsdss");
adressData = req.body
req.session.message = 'Adress successfully added'
userHelpers.AddAdress(Id, adressData)
res.redirect('/checkout')
})




router.post('/address-remove', (req, res) => {
  console.log(req.body,"this is b");
userHelpers.removeAdress(req.body).then((response) => {

  res.json(response)
})
})  

router.post('/cart-remove', (req, res) => {
  console.log(req.body,"this is b");
userHelpers.removeCartProduct(req.body).then((response) => {

  res.json(response)
})
})  

router.get('/userEdit',verifyLogin,async(req,res)=>{
  let user=req.session.user
  let addData= await userHelpers.getUserAddress(req.session.user._id)
  userHelpers.getUserDatatoEdit(req.session.user._id).then((userData) => {
    res.render("user/user-edit", { user: true,addData, userData,user,Message:req.session.success});
    req.session.success=null
    
  }).catch((error)=>{
         res.status(500).render('user/error',{ message: error.message })
       })
  
})



router.post('/edit-profile',(req,res)=>{
console.log(req.body,'jkjkjkjkjkjkjkjkjkjkjkj');
  userHelpers.editUserData(req.body,req.session.user._id).then((response) => {
       req.session.success="Profile edited succesfully "
      res.redirect("/userEdit");
      req.session.success=null

    }).catch((response)=>{
            loginErrMessage = response.errMessage;
            res.redirect("/userEdit")
          })  
})


router.get('/otp',(req,res)=>{
  res.render('user/otp',{user:true})
})


let signupData;
router.post('/otp',(req,res)=>{
  userHelpers.doOTP(req.body).then((response)=>{
    if(response.status){
        signupData=response.user;
         console.log(signupData)
        res.redirect('/confirmOtp')
        
    }
    else{
        res.redirect('/otp')
    }
})
console.log(req.body);
})

router.get('/confirmOtp',(req,res)=>{
  res.render('user/confirm-otp')
})


router.post('/confirmOtp',(req,res)=>{
  console.log(req.body)
  userHelpers.doOTPConfirm(req.body,signupData).then((response)=>{
    if(response.status){
        
        console.log("evdaaaaaaaaaaaaaaaaaaaaaa")
       req.session.loggedIn=true;
       req.session.user=signupData;

   
        res.redirect('/')
    }else{
        res.redirect('/confirmOtp')
    }
  })
})

router.get('/us-orders',verifyLogin,async(req,res)=>{

 
  let user = req.session.user 
  let wallet = await userHelpers.getUserWallet(req.session.user._id)
  console.log(wallet);
  let orders = await userHelpers.getUserOrders(req.session.user._id)
  // let details = await userhelper.viewAddress(req.session.user._id)
   let Id=req.params.id                                                          
  // let coupon = await adminhelper.viewCoupens()
  // let disCoup = await userhelper.displayCoupon(req.session.user._id)

  let historys = await userHelpers.disWalletHistory(req.session.user._id)

 //


  res.render('user/user-orders',{user:true, orders, user, wallet,historys})
})

router.get('/w',async(req,res)=>{
  let user=req.session.user
  let wallet = await userHelpers.getUserWallet(req.session.user._id)
  console.log(wallet);
  let orders = await userHelpers.getUserOrders(req.session.user._id)
  let historys = await userHelpers.disWalletHistory(req.session.user._id)
  res.render('user/w',{user:true,user, wallet,historys,orders})
})


router.post('/returnproduct',async(req,res)=>{
  let user = req.session.user

    console.log(req.body);

    let description = "Order Returned"


    await userHelpers.setWalletHistory(user,req.body,description)

    await userHelpers.returnOrder(req.body,user).then((response)=>{

        res.json(response)


    })
})



router.post('/apply-coupon',async(req,res)=>{
  let user= req.session.user._id
  // console.log("fcghvjbknlm");
  // console.log(req.body);
  const date = new Date()
  let totalAmount = await userHelpers.getTotalAmount(user)
// console.log(totalAmount,"666");
let Total = totalAmount
  // console.log(req.body,"ghjkl;");

  if (req.body.coupon == '') {
      res.json({ noCoupon: true,Total })
  } else {
      let couponResponse = await adminHelpers.applyCoupon(req.body, user, date,totalAmount)
        console.log(couponResponse,"dfghjk");
      if (couponResponse.verify) {
          let discountAmount = (totalAmount * parseInt(couponResponse.couponData.value)) / 100
          let amount = totalAmount - discountAmount
          couponResponse.discountAmount = Math.round(discountAmount)
          couponResponse.amount = Math.round(amount)
          res.json(couponResponse)
          console.log(couponResponse,"DFGHJKL");
      } else {
          couponResponse.Total = totalAmount

          // couponResponse.noCoupon = req.body.total

          // console.log( couponResponse.Total);
          res.json(couponResponse)
      }
  }
})

router.post('/paypal-status',(req,res)=>{
  userHelpers.changePaymentStatus(req.body.order).then(()=>{
    res.json({status:true})
  })
})

router.get('/payment-failedd/:orderId',async(req,res)=>{
    console.log(req.params.orderId,'heloetyu');
    let user=req.session.user
     if (req.session.user) {
      await userHelpers.deletePendingOrder(req.params.orderId)
     
     }
    res.render('404',{layout:null})
       
})



router.post('/search-input-products',(req,res)=>{
  console.log(req.body,'search field post data')
  userHelpers.searchProducts(req.body.search).then((products)=>{
    console.log(products,'fianan ress')
    res.render('user/search',{products})
  })
})

module.exports = router;
