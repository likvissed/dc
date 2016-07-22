require 'rails_helper'

RSpec.describe "server_parts/edit", type: :view do

  let(:server_part) { create(:server_part) }
  before do
    assign(:server_part, server_part)
    params[:name] = server_part.name
    render
  end

  it "renders form with server_parts action" do
    expect(rendered).to have_selector("form[action='#{server_part_path(server_part.name)}']")
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

RSpec.describe "server_parts/edit", type: :feature do

  let(:admin_user) { create(:admin_user) }
  let(:server_part) { create(:server_part) }
  before do
    login_as admin_user
    visit "server_parts/#{server_part.name}/edit"
  end

  context "when click the cancel button" do
    before { click_button "Отмена" }

    it "redirects to index page" do
      expect(current_path).to eq server_parts_path
    end
  end

  context "when sends empty data" do
    before do
      fill_in "server_part[name]", with: ""
      click_button "Готово"
    end

    it "renders page with alert" do
      expect(page).to have_selector("div[data-alert]")
    end

    it "renders form with server_parts action" do
      expect(page).to have_selector("form[action='#{server_part_path(server_part.name)}']")
    end

    it "renders form with post method" do
      expect(page).to have_selector("form[method='post']")
    end
  end

end
