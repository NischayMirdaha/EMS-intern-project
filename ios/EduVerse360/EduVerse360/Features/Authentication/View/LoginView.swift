//
//  LoginView.swift
//  EduVerse360
//
//  Created by Ekta Rai on 10/07/2026.
//
import Foundation
import SwiftUI

struct LoginView: View {
    
    enum Route: Hashable {
        case dashboard
//        case profile
//        case register
    }
    @State private var path = NavigationPath()
    @State var viewModel = LoginViewModel(loginservice: LoginMockAPI())
    var body: some View {
        NavigationStack (path: $path){
        ScrollView{
            ZStack{
                RoundedRectangle(cornerRadius: 10)
                    .fill(.white)
                    .frame(maxWidth:.infinity, maxHeight: .infinity)
                //                    .shadow(radius: 10)
                
                VStack{
                    
                    
                    
                    VStack(alignment:.leading){
                        HStack(){
                            Image("eduverselogo")
                                .renderingMode(.template)
                                .foregroundColor(Color.primary)
                            Text("EduVerse 360")
                                .font(.title2)
                                .foregroundColor(Color.primary)
                                .fontWeight(.bold)
                            
                        }
                        .padding()
                        
                        
                        
                        
                        Text("Welcome Back")
                            .font(.largeTitle)
                            .fontWeight(.semibold)
                        
                        
                        Text("Stay connected with your school anytime, anywhere.")
                            .font(.subheadline)
                            .frame(width:300,alignment: .leading)
                            .foregroundColor(.secondaryText)
                        
                    }
                    .padding()
                    
                    //Email
                    VStack(alignment:.leading){
                        
                        VStack(alignment:.leading) {
                            Text("INSTITUTION EMAIL")
                                .font(.caption)
                                .foregroundColor(.secondaryText)
                                .fontWeight(.semibold)
                            
                            HStack {
                                Image("email")
                                    .foregroundStyle(.gray)
                                    .padding()
                                
                                TextField("enter your password",text: $viewModel.userName)
                                
                            }
                            .frame(width:300, height:45)
                            .overlay(
                                RoundedRectangle(cornerRadius: 10)
                                    .stroke(Color.textFieldColor, lineWidth: 1)
                                
                            )
                            
                            
                        }
                        .padding(.bottom)
                        
                        // Password
                        
                        VStack(alignment:.leading) {
                            Text("PASSWORD")
                                .font(.caption)
                                .foregroundColor(.secondaryText)
                                .fontWeight(.semibold)
                            
                            HStack {
                                Image("lock")
                                    .foregroundStyle(.gray)
                                    .padding()
                                
                                TextField("enter your password",text: $viewModel.password)
                                Image("eye")
                                    .foregroundStyle(.gray)
                                    .padding()
                            }
                            .frame(width:300, height:45)
                            .overlay(
                                RoundedRectangle(cornerRadius: 10)
                                    .stroke(Color.textFieldColor, lineWidth: 1)
                                
                            )
                            
                            
                        }
                        .padding(.bottom)
                        
                        // Remember me
                        
                        HStack(spacing:10){
                            Button {
                                viewModel.rememberMe.toggle()
                            } label: {
                                Image(systemName: viewModel.rememberMe ? "checkmark.square.fill" : "square")
                                    .font(.title3)
                                    .foregroundColor(.blue)
                            }
                            .buttonStyle(.plain)
                            
                            
                            Text("Remember Me")
                                .font(.subheadline)
                                .foregroundColor(.secondaryText)
                            
                            Spacer()
                            Text("Forgot Password?")
                                .font(.subheadline)
                                .foregroundColor(.primary)
                            
                            
                        }
                        
                    }
                    .frame(width:300)
                    .padding()
                    
                    //Login Button
                    Button( action: {
                        Task{
                          await viewModel.loginUser()
                            if viewModel.isLoginSucceess {
                                path.append(Route.dashboard)
                            }
                          
                        }
                        
                    }, label: {
                            Text("Login")
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
                            Text("OR CONTINUE WITH")
                                .font(.caption)
                                .foregroundColor(.thirdText)
                                .padding()
                                .background(Color.white)
                        }
                        
                    }
                    
                    // signin Google Button
                    
                    Button(action: {
                        
                    } ,
                           label: {
                        Image("google")
                            .foregroundStyle(.gray)
                            .padding()
                        Text("Sign in with Google")
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
                        Text("Don't have an account?")
                            .font(.footnote)
                            .foregroundColor(.secondaryText)
                        Text("Contact Administrator")
                            .font(.footnote)
                            .foregroundColor(Color.primary)
                        
                    }
                    .padding()
                    
                }
                
                
                
            }
            
        }
        .navigationDestination(for: Route.self) { route in

            DashboardView()

        }
  
    }

        
        if let errorMessage = viewModel.errorMessage {
            Text(errorMessage)
                .foregroundColor(.primary)
        }
        
    }
}

#Preview {
    LoginView()
}
