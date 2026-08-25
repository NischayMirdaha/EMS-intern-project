//
//  RegisterView.swift
//  EduVerse360
//
//  Created by Ekta Rai on 11/07/2026.
//

import SwiftUI

struct RegisterView: View {
    @State private var email = ""
    @State private var password = ""
    @State private var fullName = ""
    @State private var phoneNumber = ""
    @State private var schoolName = ""
    @State private var role = "Select your role"
    @State private var rememberMe = false
    var body: some View {
        ScrollView {
            
//            ZStack{
//                
//                RoundedRectangle(cornerRadius: 10)
//                    .fill(.white)
//                    .frame(width:350, height: 750)
//                //                .shadow(radius: 10)
//                //
//                
                VStack{
                    
                    VStack(alignment:.leading){
                        VStack(alignment:.leading){
                            HStack(){
                                Image("eduverselogo")
                                    .renderingMode(.template)
                                    .foregroundColor(Color.primary)
                                Text("EduVerse 360")
                                    .underline()
                                    .font(.title2)
                                    .foregroundColor(Color.primary)
                                    .fontWeight(.bold)
                                
                            }
                        }
                            .padding()

                        Text("Create account")
                            .font(.largeTitle)
                            .fontWeight(.semibold)
                        
                        
                        Text("Start your journey with the world's leading school management AI.")
                            .font(.subheadline)
                            .frame(width:300,alignment: .leading)
                            .foregroundColor(.secondaryText)
                        
                    }
                    .padding()
                    
                    //full name
                    VStack(alignment:.leading){
                        
                        VStack(alignment:.leading) {
                            Text("Full Name")
                                .font(.caption)
                                .foregroundColor(Color.black)
                                .fontWeight(.semibold)
                            
                            HStack {
                                Image(systemName: "person")
                                    .padding()
                                TextField("john doe",text: $fullName)
                                
                            }
                            .frame(width:300, height:45)
                            .overlay(
                                RoundedRectangle(cornerRadius: 10)
                                    .stroke(Color.textFieldColor, lineWidth: 1)
                                
                            )
                            
                            
                        }
                        .padding(.bottom)
                        
                        //Email Address
                        
                        VStack(alignment:.leading) {
                            Text("Email Address")
                                .font(.caption)
                                .foregroundColor(Color.black)
                                .fontWeight(.semibold)
                            
                            
                            HStack {
                                Image("email")
                                    .padding()
                                TextField("johndoe@gmail",text: $fullName)
                                 
                                
                            }
                            .frame(width:300, height:45)
                            .overlay(
                                RoundedRectangle(cornerRadius: 10)
                                    .stroke(Color.textFieldColor, lineWidth: 1)
                                
                            )
                                
                            
                            
                        }
                        .padding(.bottom)
                        
                        //Phone number
                        VStack(alignment:.leading) {
                            Text("Phone Number")
                                .font(.caption)
                                .foregroundColor(Color.black)
                                .fontWeight(.semibold)
                            HStack(){
                                Image(systemName: "phone")
                                TextField("+977",text: $phoneNumber)
                                    
                            }
                                .padding()
                                    .frame(width:300, height:45)
                                    .overlay(
                                        RoundedRectangle(cornerRadius: 10)
                                            .stroke(Color.textFieldColor, lineWidth: 1)
                                        
                                    )
                            
                            
                        }
                        
                        //School name
                     
                        VStack(alignment:.leading) {
                            Text("School Name")
                                .font(.caption)
                                .foregroundColor(Color.black)
                                .fontWeight(.semibold)
                            HStack(){
                                Image(systemName: "building")
                                TextField("Itahari International College",text: $schoolName)
                                    
                            }
                            .padding()
                                .frame(width:300, height:45)
                                .overlay(
                                    RoundedRectangle(cornerRadius: 10)
                                        .stroke(Color.textFieldColor, lineWidth: 1)
                                    
                                )
                        }
                        
                        //Role
                        
                        VStack(alignment:.leading) {
                            Text("Your Role")
                                .font(.caption)
                                .foregroundColor(Color.black)
                                .fontWeight(.semibold)
                            Menu {
                                Button("Student") {
                                    role = "Student"
                                }
                                
                                Button("Teacher") {
                                    role = "Teacher"
                                }
                                
                                Button("School") {
                                    role = "School"
                                }
                                
                            } label: {
                                HStack {
                                    Text(role)
                                    
                                    Spacer()
                                    
                                    Image("dropdown")
                                }
                                .padding()
                                .frame(width: 300)
                                .background(
                                    RoundedRectangle(cornerRadius: 10)
                                        .stroke(Color.textFieldColor, lineWidth: 1)
                                    
                                )
                                
                            }
                            
                        }
                        
                        
                        //password
                        VStack(alignment:.leading) {
                            Text("Password")
                                .font(.caption)
                                .foregroundColor(Color.black)
                                .fontWeight(.semibold)
                            HStack(){
                                Image("lock")
                                TextField("+977",text: $phoneNumber)
                                    
                            }
                                .padding()
                                    .frame(width:300, height:45)
                                    .overlay(
                                        RoundedRectangle(cornerRadius: 10)
                                            .stroke(Color.textFieldColor, lineWidth: 1)
                                        
                                    )
                            
                            
                        }
                        
                        //Confirm password
                        VStack(alignment:.leading) {
                            Text("Confirm Password")
                                .font(.caption)
                                .foregroundColor(Color.black)
                                .fontWeight(.semibold)
                            HStack(){
                                Image("lock")
                                TextField("+977",text: $phoneNumber)
                                
                            }
                            .padding()
                            .frame(width:300, height:45)
                            .overlay(
                                RoundedRectangle(cornerRadius: 10)
                                    .stroke(Color.textFieldColor, lineWidth: 1)
                                
                            )
                            
                        }
                        
                        // Remember me
                        
                        HStack(spacing:10){
                            Button {
                                rememberMe.toggle()
                            } label: {
                                Image(systemName: rememberMe ? "checkmark.square.fill" : "square")
                                    .font(.title3)
                                    .foregroundColor(.blue)
                            }
                            .buttonStyle(.plain)
                            
                            HStack(){
                                Text("I agree to the")
                                    .font(.subheadline)
                                    .foregroundColor(.secondaryText)
                                Text("Terms of Service")
                                    .font(.headline)
                                    .foregroundColor(Color.primary)
                                Text("and")
                                    .font(.subheadline)
                                    .foregroundColor(.secondaryText)
                                Text("Privacy Policy")
                                    .font(.headline)
                                    .foregroundColor(Color.primary)
                                
                            }
                            
                            
                        }
                        
                    }
                    .frame(width:300)
                    .padding()
                    
                    //Login Button
                    Button( action: {}, label: {
                        Text("Create Account")
                            .font(.headline)
                            .fontWeight(.bold)
                            .foregroundColor(Color.white)
                            .frame(width:200)
                            .padding()
                            .background(Color.primary)
                            .cornerRadius(10)
                        
                        
                    }
                    )
                    
                    // Divider
                    VStack{
                        ZStack() {
                            Divider()
                                .frame(width:300)
                                .padding()
                            Text("OR")
                                .font(.caption)
                                .foregroundColor(.thirdText)
                                .padding()
                                .background(Color.white)
                        }
                        
                    }
                    
                    // Cotinue Google Button
                    
                    Button(action: {
                        
                    } ,
                           label: {
                        Image("google")
                            .foregroundStyle(.gray)
                            .padding()
                        Text("Continue with Google")
                            .foregroundColor(Color.black)
                            .fontWeight(.semibold)
                    })
                    .frame(width:300,height:50)
                    .background(
                        RoundedRectangle(cornerRadius:10)
                            .fill(Color.white)
                            .stroke(Color.textFieldColor, lineWidth: 1)
                    )
                    
                    //last portion
                    HStack(){
                        Text("Already have an account?")
                            .font(.subheadline)
                            .foregroundColor(.secondaryText)
                        Text("Sign In")
                            .font(.subheadline)
                            .fontWeight(.bold)
                            .foregroundColor(Color.primary)
                        
                    }
                    .padding()
                    
                }
                
            }
        }
    }
//}

#Preview {
    RegisterView()
}
