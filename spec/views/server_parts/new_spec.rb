require 'rails_helper'

RSpec.describe "server_parts/new", type: :view do

  let(:server_part) { build(:server_part) }
  before do
    assign(:server_part, server_part)
    render
  end

  it "renders form with server_parts action" do
    expect(rendered).to have_selector("form[action='#{server_parts_path}']")
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

RSpec.describe "server_parts/new", type: :feature, js: true do

  let(:admin_user) { create(:admin_user) }
  let!(:detail_type) { create(:detail_type) }
  before do
    login_as admin_user
    visit new_server_part_path
  end

  context "when click the cancel button" do
    before { click_button "Отмена" }

    it "redirects to index page" do
      expect(current_path).to eq server_parts_path
    end
  end

  context "when send empty data" do
    before { click_button "Готово" }

    it "renders page with alert" do
      expect(page).to have_selector("div.absolute[data-alert]")
    end

    it "renders form with server_parts action" do
      expect(page).to have_selector("form[action='#{server_parts_path}']")
    end

    it "renders form with post method" do
      expect(page).to have_selector("form[method='post']")
    end
  end

end