// function addToCart(proId) {
// $.ajax({
//     url:'/add-to-cart/'+proId,
//     method:'get',
//     success:(response)=>{
//         if(response.ststus){
//             let count=$('#cart-count').html()
//             count=parseInt(count)+1
//             $("#cart-count").html(count)
//         }
//         Swal.fire(
//             'Good job!',
//             'You clicked the button!',
//             'success'
//             )
//     }
// })
// }


<script src="//cdn.jsdelivr.net/npm/sweetalert2@11"></script>

function addToCart(proId) {
    $.ajax({
        url:'/add-to-cart/'+proId,
        method:'get',
        success:(response)=>{
            if(response.ststus){
                let count=$('#cart-count').html()
                count=parseInt(count)+1
                $("#cart-count").html(count)
            }
             
            var notification = alertify.notify('Product added to cart', 'success', 3, function(){  console.log('dismissed'); });
            alertify.set('notifier','position', 'top-center');
           
        }
    })
    }

    function editUserData() {
        $.ajax({
            url:'/edit-profile',
            method:'post',
            success:(response)=>{
            
                 
        var notification = alertify.notify('Product added to cart', 'success', 3, function(){  console.log('dismissed'); });
         alertify.set('notifier','position', 'top-center');
        
            }
        })
        }