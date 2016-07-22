require 'rails_helper'

RSpec.describe "detail_types/edit", type: :view do

  let(:detail_type) { create(:detail_type) }
  before do
    assign(:detail_type, detail_type)
    params[:name] = detail_type.name
    render
  end

  it "renders form with detail_types action" do
    expect(rendered).to have_selector("form[action='#{detail_type_path(detail_type.name)}']")
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

RSpec.describe "detail_types/edit", type: :feature do

  let(:admin_user) { create(:admin_user) }
  let(:detail_type) { create(:detail_type) }
  before do
    login_as admin_user
    visit "detail_types/#{detail_type.name}/edit"
  end

  context "when click the cancel button" do
    before { click_button "Отмена" }

    it "redirects to index page" do
      expect(current_path).to eq detail_types_path
    end
  end

  context "when sends empty data" do
    before do
      fill_in "detail_type[name]", with: ""
      click_button "Готово"
    end

    it "renders page with alert" do
      expect(page).to have_selector("div[data-alert]")
    end

    it "renders form with detail_types action" do
      expect(page).to have_selector("form[action='#{detail_type_path(detail_type.name)}']")
    end

    it "renders form with post method" do
      expect(page).to have_selector("form[method='post']")
    end
  end

end
