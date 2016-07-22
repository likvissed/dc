require 'rails_helper'

RSpec.describe "node_roles/edit", type: :view do

  let(:node_role) { create(:node_role) }
  before do
    assign(:node_role, node_role)
    params[:name] = node_role.name
    render
  end

  it "renders form with node_roles action" do
    expect(rendered).to have_selector("form[action='#{node_role_path(node_role.name)}']")
  end

  it "renders form with post method" do
    expect(rendered).to have_selector("form[method='post']")
  end

  it "renders \"ready\" button with name='commit'" do
    expect(rendered).to have_selector("input[name='commit']")
  end

  it "renders \"ready\" button with value='Готово'" do
    expect(rendered).to have_selector("input[value='Готово']")
  end

  it "renders \"cancel\" button with name='cancel'" do
    expect(rendered).to have_selector("button[name='cancel']")
  end

  it "renders \"cancel\" button with value='true'" do
    expect(rendered).to have_selector("button[value='true']")
  end

end

RSpec.describe "node_roles/edit", type: :feature do

  let(:admin_user) { create(:admin_user) }
  let(:node_role) { create(:node_role) }
  before do
    login_as admin_user
    visit "node_roles/#{node_role.name}/edit"
  end

  context "when click the cancel button" do
    before { click_button "Отмена" }

    it "redirects to index page" do
      expect(current_path).to eq node_roles_path
    end
  end

  context "when sends empty data" do
    before do
      fill_in "node_role[name]", with: ""
      click_button "Готово"
    end

    it "renders page with alert" do
      expect(page).to have_selector("div[data-alert]")
    end

    it "renders form with node_roles action" do
      expect(page).to have_selector("form[action='#{node_role_path(node_role.name)}']")
    end

    it "renders form with post method" do
      expect(page).to have_selector("form[method='post']")
    end
  end

end
