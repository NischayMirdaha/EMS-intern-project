//
//  MainTabView.swift
//  EduVerse360
//
//  Created by Ekta Rai on 14/07/2026.
//

import SwiftUI

struct MainTabView: View {
    var body: some View {
        TabView{
            HomeView()
                .tabItem{
                    Label("Home",systemImage: "house")
                }
        
            SettingsView()
                .tabItem{
                    Label("Setting",systemImage: "gearshape")
                }
            
            
        }
    }
}

#Preview {
    MainTabView()
}
